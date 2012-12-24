(function () {

	var Core = CPU.Core;

	Core.registerInstruction (inst_MRS_CPSR, 0x10, 0, false);
	function inst_MRS_CPSR (inst, info) { info.Rd.set (this.cpsr.get ()); }

	Core.registerInstruction (inst_MRS_SPSR, 0x14, 0, false);
	function inst_MRS_SPSR (inst, info)
	{	
		var spsr = this.getReg (CPU.Reg.SPSR);
		if (!spsr)
			throw "attempted to read non-existent SPSR";
		info.Rd.set (spsr.get ());
	}

	Core.registerInstruction (inst_MSR, [0x32, 0x36], -1, false);
	Core.registerInstruction (inst_MSR, [0x12, 0x16], 0, false);
	function inst_MSR (inst, info)
	{
		// masks for armv4
		/** @const */ var UnallocMask = 0x0FFFFF20;
		/** @const */ var UserMask = 0xF0000000;
		/** @const */ var PrivMask = 0x000000DF;
		/** @const */ var StateMask = 0x00000000;

		/** @const */ var I = 1 << 25;
		/** @const */ var R = 1 << 22;

		var field_mask = (inst >>> 16) & 0x0F;
		var operand;

		if (inst & I)
		{
			var immed_8 = inst & 0xFF;
			var rotate_imm = (inst >>> 8) & 0x0F;
			operand = Util.rotRight (immed_8, rotate_imm * 2);
		}
		else
		{
			operand = info.Rm.get ();
		}

		if (operand & UnallocMask)
			throw "attempted to set reserved PSR bits";

		var byte_mask =
			(inst & (1 << 16) ? 0x000000FF : 0) |
			(inst & (1 << 17) ? 0x0000FF00 : 0) |
			(inst & (1 << 18) ? 0x00FF0000 : 0) |
			(inst & (1 << 19) ? 0xFF000000 : 0);
		var mask;

		if (inst & R)
		{
			var spsr = this.getReg (CPU.Reg.SPSR);
			if (!spsr)
				throw "attempted to read non-existent SPSR";

			mask = byte_mask & (UserMask | PrivMask | StateMask);
			spsr._value = (spsr._value & ~mask) | (operand & mask);
		}
		else
		{
			if (this.cpsr.getMode () != CPU.Mode.USR)
			{
				if (operand & StateMask)
					throw "attempted to set non-ARM state";
				else
					mask = byte_mask & (UserMask | PrivMask);
			}
			else
				mask = byte_mask & UserMask;
			this.cpsr._value = (this.cpsr._value & ~mask) | (operand & mask);
		}
	}

})();
