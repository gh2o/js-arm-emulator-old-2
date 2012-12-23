(function () {

	var Core = CPU.Core;

	function registerMiscAccess (func, load, ident2)
	{
		var base = load ? 0x01 : 0x00;
		for (var i = 0; i < 32; i += 2)
		{
			var ident1 = base | i;
			Core.registerInstruction (func, ident1, ident2, false);
		}
	}

	function doMiscAccess (cpu, inst, info, alignment, func)
	{
		/** @const */ var I = 1 << 22;
		/** @const */ var P = 1 << 24;
		/** @const */ var U = 1 << 23;
		/** @const */ var W = 1 << 21;

		var Rn = info.Rn;
		var n = Rn.get ();
		if ((n & (alignment - 1)) && (cpu.creg._value & CPU.Control.A))
			throw "access alignment fault";

		var index;
		if (inst & I)
			index = ((inst >>> 4) & 0xF0) | (inst & 0x0F);
		else
			index = info.Rm.get ();

		if (!(inst & U))
			index = -index;

		var p = !!(inst & P);
		var w = !!(inst & W);

		var address = p ? n + index : n;
		address >>>= 0;

		func (address, info.Rd, cpu.mmu, cpu);

		if (p && w)
			Rn.set (address);
		else if (!p)
			Rn.set (address + index);
	}

	registerMiscAccess (inst_LDRH, true, 11);
	function inst_LDRH (inst, info)
	{
		doMiscAccess (
			this, inst, info, 2,
			function (address, Rd, mmu, cpu) {
				if (address & 0x01)
					throw "unpredictable LDRH";
				Rd.set (mmu.read16 (address));
			}
		);
	}

	registerMiscAccess (inst_STRH, false, 11);
	function inst_STRH (inst, info)
	{
		doMiscAccess (
			this, inst, info, 2,
			function (address, Rd, mmu, cpu) {
				if (address & 0x01)
					throw "unpredictable STRH";
				mmu.write16 (address, Rd.get ());
			}
		);
	}

	// LDRD is actually encoded as a non-load instruction
	registerMiscAccess (inst_LDRD, false /* WTF */, 13);
	function inst_LDRD (inst, info)
	{
		doMiscAccess (
			this, inst, info, 8,
			function (address, Rd, mmu, cpu) {
				if (address & 0x07)
					throw "unpredictable LDRD";
				if ((Rd.index & 0x01) || (Rd.index == 14))
					throw "unpredictable LDRD";
				Rd.set (mmu.read32 (address));
				cpu.getReg (Rd.index + 1).set (mmu.read32 (address + 4));
			}
		);
	}


	registerMiscAccess (inst_STRD, false, 15);
	function inst_STRD (inst, info)
	{
		doMiscAccess (
			this, inst, info, 8,
			function (address, Rd, mmu, cpu) {
				if (address & 0x07)
					throw "unpredictable STRD";
				if ((Rd.index & 0x01) || (Rd.index == 14))
					throw "unpredictable STRD";
				mmu.write32 (address, Rd.get ());
				mmu.write32 (address + 4, cpu.getReg (Rd.index + 1).get ());
			}
		);
	}

	registerMiscAccess (inst_LDRSH, true, 15);
	function inst_LDRSH (inst, info)
	{
		doMiscAccess (
			this, inst, info, 2,
			function (address, Rd, mmu, cpu) {
				if (address & 0x01)
					throw "unpredictable LDRSH";
				Rd.set (mmu.read16 (address) << 16 >> 16);
			}
		);
	}

})();
