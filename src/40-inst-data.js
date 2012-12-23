(function () {

	var Core = CPU.Core;

	function registerData (func, base)
	{
		// immediate
		Core.registerInstruction (func, [base | 0x20, base | 0x21], -1, false);
		// register
		var ident2 = [0, 2, 4, 6, 8, 10, 12, 14, 1, 3, 5, 7];
		Core.registerInstruction (func, [base, base | 0x01], ident2, false);
	}

	function doData (cpu, inst, info, write, func, flagsfunc)
	{
		/** @const */ var I = 1 << 25;
		/** @const */ var S = 1 << 20;
		/** @const */ var SHIFT_BY_REGISTER = 1 << 4;

		var cflag = !!(cpu.cpsr._value & CPU.Status.C);

		// first decode shifter operand
		var shifter_operand = 0;
		var shifter_carry_out = false;

		if (inst & I)
		{
			// immediate
			var rotate_imm = (inst >>> 8) & 0x0F;
			var immed_8 = inst & 0xFF;
			shifter_operand = Util.rotRight (immed_8, rotate_imm * 2);
			if (rotate_imm != 0)
				shifter_carry_out = shifter_operand & (1 << 31);
		}
		else
		{
			// register
			var shift = (inst >>> 5) & 0x03;
			var sval;
			if (inst & SHIFT_BY_REGISTER)
			{
				sval = info.Rs.get () & 0xFF;
			}
			else
			{
				var shift_imm = (inst >>> 7) & 0x1F;
				if (shift_imm != 0)
					sval = shift_imm;
				else
					sval = [0, 32, 32, -1][shift];
			}

			var rm = info.Rm.get ();
			switch (shift)
			{
				case 0:
					if (sval == 0)
					{
						shifter_operand = rm;
						shifter_carry_out = cflag;
					}
					else if (sval < 32)
					{
						shifter_operand = rm << sval;
						shifter_carry_out = rm & (1 << (32 - sval));
					}
					else if (s == 32)
					{
						shifter_operand = 0;
						shifter_carry_out = rm & (1 << 0);
					}
					break;
				case 1:
					if (sval == 0)
					{
						shifter_operand = rm;
						shifter_carry_out = cflag;
					}
					else if (sval < 32)
					{
						shifter_operand = rm >>> sval;
						shifter_carry_out = rm & (1 << (sval - 1));
					}
					else if (sval == 32)
					{
						shifter_operand = 0;
						shifter_carry_out = rm & (1 << 31);
					}
					break;
				case 2:
					if (sval == 0)
					{
						shifter_operand = rm;
						shifter_carry_out = cflag;
					}
					else if (sval < 32)
					{
						shifter_operand = rm >> sval;
						shifter_carry_out = rm & (1 << (sval - 1));
					}
					else
					{
						shifter_carry_out = rm & (1 << 31);
						shifter_operand = shifter_carry_out ? -1 : 0;
					}
					break;
				case 3:
					var ssub = sval & 0x1F;
					if (sval == -1)
					{
						shifter_operand = (cflag << 31) | (rm >>> 1);
						shifter_carry_out = rm & (1 << 0);
					}
					else if (sval == 0)
					{
						shifter_operand = rm;
						shifter_carry_out = cflag;
					}
					else if (ssub == 0)
					{
						shifter_operand = rm;
						shifter_carry_out = rm & (1 << 31);
					}
					else
					{
						shifter_operand = Util.rotRight (rm, ssub);
						shifter_carry_out = rm & (1 << (ssub - 1));
					}
					break;
			}
		}

		shifter_operand >>>= 0;
		shifter_carry_out = !!shifter_carry_out;

		// do the actual operation
		var a = info.Rn.get () >>> 0;
		var b = shifter_operand >>> 0;
		var r = func (a, b) >>> 0;

		if (write)
			info.Rd.set (r);

		if (write && (inst & S) && (info.Rd.index == 15))
		{
			var spsr = cpu.getReg (CPU.Reg.SPSR);
			if (cpu.getReg (CPU.Reg.SPSR))
				cpu.cpsr._value = spsr._value;
			else
				throw "attempted to set CPSR to SPSR when no SPSR exists";
		}
		else if (inst & S)
		{
			var orig = cpu.cpsr._value >>> 0;
			cpu.cpsr._value = (
				(orig & ~CPU.Status.ALL) |
				flagsfunc (a, b, r, shifter_carry_out, orig)
			) >>> 0;
		}
	}

	function commonFlagsFunc (a, b, r, sco, orig)
	{
		return (
			(r & (1 << 31) ? CPU.Status.N : 0) |
			(r == 0 ? CPU.Status.Z : 0) |
			(sco ? CPU.Status.C : 0) |
			(orig & CPU.Status.V)
		);
	}

	function subFlagsFunc (a, b, r, sco, orig)
	{
		var a31 = !!(a & (1 << 31));
		var b31 = !!(b & (1 << 31));
		var r31 = !!(r & (1 << 31));
		return (
			(r & (1 << 31) ? CPU.Status.N : 0) |
			(r == 0 ? CPU.Status.Z : 0) |
			((a31 || !b31) && (!b31 || !r31) && (!r31 || a31) ? CPU.Status.C : 0) |
			((a31 != b31) && (a31 != r31) ? CPU.Status.V : 0)
		);
	}

	registerData (inst_AND, 0x00);
	function inst_AND (inst, info)
	{
		doData (
			this, inst, info, true,
			function (a, b) { return a & b; },
			commonFlagsFunc
		);
	}

	registerData (inst_SUB, 0x04);
	function inst_SUB (inst, info)
	{
		doData (
			this, inst, info, true,
			function (a, b) { return a - b; }
		);
	}

	registerData (inst_ADD, 0x08);
	function inst_ADD (inst, info)
	{
		doData (
			this, inst, info, true,
			function (a, b) { return a + b; }
		);
	}

	registerData (inst_TST, 0x11);
	function inst_TST (inst, info)
	{
		doData (
			this, inst, info, false,
			function (a, b) { return a & b; },
			commonFlagsFunc
		);
	}

	registerData (inst_TEQ, 0x13);
	function inst_TEQ (inst, info)
	{
		doData (
			this, inst, info, false,
			function (a, b) { return a ^ b; },
			commonFlagsFunc
		);
	}

	registerData (inst_CMP, 0x15);
	function inst_CMP (inst, info)
	{
		doData (
			this, inst, info, false,
			function (a, b) { return a - b; },
			subFlagsFunc
		);
	}

	registerData (inst_ORR, 0x18);
	function inst_ORR (inst, info)
	{
		doData (
			this, inst, info, true,
			function (a, b) { return a | b; },
			commonFlagsFunc
		);
	}

	registerData (inst_MOV, 0x1a);
	function inst_MOV (inst, info)
	{
		doData (
			this, inst, info, true,
			function (a, b) { return b; },
			commonFlagsFunc
		);
	}

	registerData (inst_BIC, 0x1c);
	function inst_BIC (inst, info)
	{
		doData (
			this, inst, info, true,
			function (a, b) { return a & ~b; },
			commonFlagsFunc
		);
	}

})();
