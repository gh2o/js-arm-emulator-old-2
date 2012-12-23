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

	function doAccess (cpu, inst, info, func)
	{
		/** @const */ var P = 1 << 24;
		/** @const */ var U = 1 << 23;
		/** @const */ var W = 1 << 21;
		/** @const */ var NOT_I = 1 << 25;

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

		var address;
		if (p)
		{
			address = (info.Rn.get () + index) >>> 0;
			if (w) // pre-indexed
				info.Rn.set (address);
		}
		else // post-indexed
		{
			address = info.Rn.get () >>> 0;
			info.Rn.set (address + index);
		}

		func (address, info.Rd, cpu.mmu);
	}

	registerAccess (inst_LDR, true, false, false);
	function inst_LDR (inst, info)
	{
		doAccess (
			this, inst, info,
			function (address, Rd, mmu) {
				// FIXME: assumed that U == 0
				var data = mmu.read32 (address);
				data = Util.rotRight (data, 8 * (address & 0x03));

				if (Rd.index == 15)
				{
					// FIXME: thumb?
					Rd.set (data & ~0x3);
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
			this, inst, info,
			function (address, Rd, mmu) {
				// FIXME: armv5 specific
				mmu.write32 (address & ~0x3, Rd.get ());
			}
		);
	}

})();
