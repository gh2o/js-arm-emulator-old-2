(function () {

	var Core = CPU.Core;

	function mult32 (p, q)
	{
		var a = p >>> 16;
		var b = p & 0xFFFF;
		var c = q >>> 16;
		var d = q & 0xFFFF;

		var r = ((a * d + b * c) << 16) + (b * d);
		return r >>> 0;
	}

	function setFlags (cpu, nin, z)
	{
		var val = cpu.cpsr._value;
		val = (val & ~(CPU.Status.N | CPU.Status.Z)) |
			(nin & (1 << 31) ? CPU.Status.N : 0) |
			(z ? CPU.Status.Z : 0);
		cpu.cpsr._value = val;
	}

	/** @const */ var S = 1 << 20;

	Core.registerInstruction (inst_MUL, [0x00, 0x01], 9, false);
	function inst_MUL (inst, info)
	{
		// Rn and Rd are swapped
		var Rd = info.Rn;
		var Rs = info.Rs;
		var Rm = info.Rm;

		var res = mult32 (Rm.get (), Rs.get ());
		Rd.set (res);
		if (inst & S)
			setFlags (this, res, res == 0);
	}

	Core.registerInstruction (inst_MLA, [0x02, 0x03], 9, false);
	function inst_MLA (inst, info)
	{
		// Rn and Rd are swapped
		var Rn = info.Rd;
		var Rd = info.Rn;
		var Rs = info.Rs;
		var Rm = info.Rm;

		var res = mult32 (Rm.get (), Rs.get ()) + Rn.get ();
		Rd.set (res);
		if (inst & S)
			setFlags (this, res, res == 0);
	}

})();
