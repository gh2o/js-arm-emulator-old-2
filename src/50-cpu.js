(function () {

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

	Core.prototype.tick = function () {
		var inst = this.mmu.read32 (this.pc._value);
		this.pc._value += 4;

		var cond = inst >>> 28;
		if (cond < 14 && !evaluateCondition (cond, this.cpsr))
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
			console.log ("error executing " + Util.hex32 (this.pc._value - 4));
			this.dumpRegisters ();
			throw e;
		}
	};

	Core.prototype.dumpRegisters = function () {
		console.log ("registers:");
		for (var i = 0; i < 18; i++)
		{
			var reg = this.getReg (i);
			console.log ("  " + reg.bank + "\t" + i + " = " + Util.hex32 (reg.get ()));
		}
	};

})();
