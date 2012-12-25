(function () {

	/** @const */ var PSR_I = 1 << 7;
	/** @const */ var PSR_F = 1 << 6;

	var Core = CPU.Core;

	var instructionTable = Core.instructionTable;

	function evaluateCondition (cond, cpsr)
	{
		var val = cpsr._value;
		var N = !!(val & CPU.Status.N);
		var Z = !!(val & CPU.Status.Z);
		var C = !!(val & CPU.Status.C);
		var V = !!(val & CPU.Status.V);

		switch (cond)
		{
			case 0: return Z;
			case 1: return !Z;
			case 2: return C;
			case 3: return !C;
			case 4: return N;
			case 5: return !N;
			case 6: return V;
			case 7: return !V;
			case 8: return C && !Z;
			case 9: return !C || Z;
			case 10: return N == V;
			case 11: return N != V;
			case 12: return !Z && (N == V);
			case 13: return Z || (N != V);
			case 14: return true;
			case 15: return true;
			default: throw "unhandled condition";
		}
	}

	Core.prototype.enterException = function (mode, vect, target, nofiq) {

		var cpsr = this.cpsr;
		var creg = this.creg;

		// save cpsr
		var spsr = cpsr._value;

		// set cpsr (FIXME: thumb?)
		cpsr._value = (cpsr._value & ~0x1F) | (mode & 0x1F); // set mode
		cpsr._value |= PSR_I | (nofiq ? PSR_F : 0); // disable interrupts

		// then return target (+4)
		this.getReg (CPU.Reg.LR).set (target + 4);

		// then SPSR
		this.getReg (CPU.Reg.SPSR).set (spsr);

		// do jump
		this.pc.set (vect | (creg._value & CPU.Control.V ? 0xFFFF0000 : 0));
	};

	Core.prototype.tick = function () {

		var cpsr = this.cpsr;

		// check for interrupts
		var vic = this.vic;

		var iss = (vic.intLines | vic.regSoftLines) & vic.regIntEnable;
		var ris = vic.regIntSelect;

		if ((iss & ris) && !(cpsr._value & PSR_F))
		{
			this.enterException (CPU.Mode.FIQ, 0x1C, this.pc._value, true);
			return;
		}

		if ((iss & ~ris) && !(cpsr._value & PSR_I))
		{
			this.enterException (CPU.Mode.IRQ, 0x18, this.pc._value, false);
			return;
		}

		// only run after that
		var inst = this.mmu.read32 (this.pc._value);
		this.pc._value += 4;

		var cond = inst >>> 28;
		if (cond < 14 && !evaluateCondition (cond, cpsr))
			return;

		var ident = 
			((cond == 15) << 12) |
			((inst >>> 16) & 0x0FF0) |
			((inst >>> 4) & 0x0F);

		var func = instructionTable[ident];

		if (!func)
		{
			var ident1 = (ident >>> 4) & 0xFF;;
			var ident2 = ident & 0x0F;
			var uncond = (cond == 15);

			var msg = 'undefined instruction at ' + Util.hex32 (this.pc._value - 4) +
				' : ' + Util.hex32 (inst);
			console.log (msg);
			console.log ('ident1 = 0x' + ident1.toString (16));
			console.log ('ident2 = 0x' + ident2.toString (16));
			console.log ('unconditional = ' + uncond);
			throw msg;
		}

		var bank = this.getRegBank ();
		var info = this.info;
		info.Rn = bank[(inst >>> 16) & 0x0F];
		info.Rd = bank[(inst >>> 12) & 0x0F];
		info.Rs = bank[(inst >>>  8) & 0x0F];
		info.Rm = bank[(inst       ) & 0x0F];

		try {
			func.call (this, inst, info);
		} catch (e) {
			// closure compiler workaround
			if ((e === CPU.DataAbort) || (e instanceof CPU.DataAbort))
			{
				// FIXME: might be incorrect if data access occurs after PC changed
				this.enterException (CPU.Mode.ABT, 0x10, this.pc._value, false);
			}
			else
			{
				console.log ("error executing " + Util.hex32 (this.pc._value - 4));
				this.dumpRegisters ();
				throw e;
			}
		}
	};

	Core.prototype.dumpRegisters = function () {
		console.log ("registers:");
		for (var i = 0; i < 18; i++)
		{
			var reg = this.getReg (i);
			console.log ("  " + reg.bank + "\t" + i + " = " + Util.hex32 (reg._value));
		}
	};

})();
