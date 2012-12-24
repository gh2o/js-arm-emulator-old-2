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

	function umult64 (p, q)
	{
		var a = p >>> 16;
		var b = p & 0xFFFF;
		var c = q >>> 16;
		var d = q & 0xFFFF;

		// multiply base parts
		var lo = b * d;
		var hi = a * c;

		// add middle part
		var mid = a * d + b * c;
		hi += (mid > 0xFFFFFFFF) ? 0x10000 : 0;
		lo += (mid << 16) >>> 0;
		hi += (mid >>> 16);

		// do carry
		hi += (lo > 0xFFFFFFFF) ? 1 : 0;

		// truncate
		lo >>>= 0;
		hi >>>= 0;

		return {lo: lo, hi: hi};
	}

	function smult64 (p, q)
	{
		var ret = umult64 (Math.abs (p), Math.abs (q));
		if ((p ^ q) & (1 << 31))
		{
			// flip
			ret.hi = ~ret.hi >>> 0;
			ret.lo = -ret.lo >>> 0;
			if (ret.lo == 0) // carry
				ret.hi = (ret.hi + 1) >>> 0;
		}
		return ret;
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

	Core.registerInstruction (inst_SMULL_UMULL_SMLAL_UMLAL,
		[0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F], 9, false);
	function inst_SMULL_UMULL_SMLAL_UMLAL (inst, info)
	{
		/** @const */ var S = 1 << 20;
		/** @const */ var ACCUM = 1 << 21;
		/** @const */ var SIGNED = 1 << 22;

		var RdHi = info.Rn;
		var RdLo = info.Rd;
		var Rs = info.Rs;
		var Rm = info.Rm;
		
		var p = Rm.get (), q = Rs.get ();
		var r = (inst & SIGNED) ? smult64 (p, q) : umult64 (p, q);

		var tlo = r.lo;
		var thi = r.hi;

		if (inst & ACCUM)
		{
			tlo += RdLo.get ();
			thi += RdHi.get () + (tlo > 0xFFFFFFFF ? 1 : 0);
		}

		RdLo.set (tlo);
		RdHi.set (thi);

		if (inst & S)
			setFlags (this, thi, (tlo == 0) && (thi == 0));
	}

})();
