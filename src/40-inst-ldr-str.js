(function () {

	var Core = CPU.Core;

	function registerAccess (func, load, bite, user)
	{
		/** @const */ var P = 0x10;
		/** @const */ var U = 0x08;
		/** @const */ var B = 0x04;
		/** @const */ var W = 0x02;
		/** @const */ var L = 0x01;

		var base = 0x40 | (load ? L : 0) | (bite ? B : 0);

		var ident1;
		if (user)
			ident1 = [base | W];
		else
			ident1 = [base, base | P, base | W | P];

		// add U flag
		var len = ident1.length;
		for (var i = 0; i < len; i++)
			ident1.push (ident1[i] | U);

		// immediate
		Core.registerInstruction (func, ident1, -1, false);
		
		// register
		for (var i = 0; i < ident1.length; i++)
			ident1[i] |= 0x20;
		Core.registerInstruction (func, ident1, [0, 2, 4, 6, 8, 10, 12, 14], false);
	}

	function doAccess (cpu, inst, info, alignment, func)
	{
		/** @const */ var P = 1 << 24;
		/** @const */ var U = 1 << 23;
		/** @const */ var W = 1 << 21;
		/** @const */ var NOT_I = 1 << 25;

		var Rn = info.Rn;
		var n = Rn.get ();
		if ((n & (alignment - 1)) && (cpu.creg._value & CPU.Control.A))
			throw "access alignment fault";

		var index;
		if (inst & NOT_I)
		{
			// register offset
			var m = info.Rm.get ();
			var shift = (inst >>> 5) & 0x03;
			var shift_imm = (inst >>> 7) & 0x1F;
			switch (shift)
			{
				case 0:
					index = m << shift_imm;
					break;
				case 1:
					if (shift_imm == 0)
						index = 0;
					else
						index = m >>> shift_imm;
					break;
				case 2:
					if (shift_imm == 0)
						index = (m & (1 << 31)) ? -1 : 0;
					else
						index = m >> shift_imm;
					break;
				case 3:
					if (shift_imm == 0)
						index = (!!(cpu.cpsr._value & CPU.Status.C) << 31) | (m >>> 1);
					else
						index = Util.rotRight (m, shift_imm);
					break;
			}
		}
		else
		{
			// immediate offset
			index = inst & 0x0FFF;
		}

		if (!(inst & U))
			index = -index;

		var p = !!(inst & P);
		var w = !!(inst & W);

		var address = p ? n + index : n;
		address >>>= 0;

		func (address, info.Rd, cpu.mmu);

		if (p && w)
			Rn.set (address);
		else if (!p)
			Rn.set (address + index);
	}

	registerAccess (inst_LDR, true, false, false);
	function inst_LDR (inst, info)
	{
		doAccess (
			this, inst, info, 4,
			function (address, Rd, mmu) {
				// FIXME: assumed that U == 0
				var data = mmu.read32 (address & ~0x03);
				data = Util.rotRight (data, 8 * (address & 0x03));

				if (Rd.index == 15)
				{
					// FIXME: thumb?
					Rd.set (data & ~0x03);
				}
				else
				{
					Rd.set (data);
				}
			}
		);
	}

	registerAccess (inst_STR, false, false, false);
	function inst_STR (inst, info)
	{
		doAccess (
			this, inst, info, 4,
			function (address, Rd, mmu) {
				// FIXME: armv5 specific
				mmu.write32 (address & ~0x03, Rd.get ());
			}
		);
	}

	registerAccess (inst_LDRB, true, true, false);
	function inst_LDRB (inst, info)
	{
		doAccess (
			this, inst, info, 1,
			function (address, Rd, mmu) {
				Rd.set (mmu.read8 (address));
			}
		);
	}

	registerAccess (inst_STRB, false, true, false);
	function inst_STRB (inst, info)
	{
		doAccess (
			this, inst, info, 1,
			function (address, Rd, mmu) {
				mmu.write8 (address, Rd.get () & 0xFF);
			}
		);
	}

	Core.registerInstruction (inst_PLD, [0x55, 0x5D], -1, true);
	Core.registerInstruction (inst_PLD, [0x75, 0x7D], [0, 2, 4, 6, 8, 10, 12, 14], true);
	function inst_PLD (inst, info)
	{
		// only to do pre/post-index
		doAccess (this, inst, info, 1, function () {});
	}

})();
