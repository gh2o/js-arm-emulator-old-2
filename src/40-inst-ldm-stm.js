(function () {

	var Core = CPU.Core;

	function doMultiple (cpu, inst, info, func)
	{
		/** @const */ var W = 1 << 21;

		var nr = inst & 0xFFFF;
		nr = nr - ((nr >>> 1) & 0x5555);
		nr = ((nr >>> 2) & 0x3333) + (nr & 0x3333);
		nr = ((nr >>> 4) + nr) & 0x0F0F;
		nr = ((nr >>> 8) + nr) & 0x00FF;
		var nr4 = nr << 2;

		var start_address, end_address;

		var Rn = info.Rn;
		var n = Rn.get ();

		var pu = (inst >>> 23) & 0x03;
		switch (pu)
		{
			case 0:
				start_address = n - nr4 + 4;
				end_address = n;
				break;
			case 1:
				start_address = n;
				end_address = n + nr4 - 4;
				break;
			case 2:
				start_address = n - nr4;
				end_address = n - 4;
				break;
			case 3:
				start_address = n + 4;
				end_address = n + nr4;
				break;
		}

		start_address = (start_address & ~0x03) >>> 0;
		end_address = (end_address & ~0x03) >>> 0;

		if ((start_address & 0x03) && (cpu.creg._value & CPU.Control.A))
			throw "access alignment fault";

		func (start_address, end_address, inst & 0xFFFF, cpu.getRegBank (), cpu.mmu);

		if (inst & W)
		{
			if (pu & 0x01)
				Rn.set (n + nr4);
			else
				Rn.set (n - nr4);
		}
	}

	Core.registerInstruction (inst_LDM_1, [0x81, 0x83, 0x89, 0x8B, 0x91, 0x93, 0x99, 0x9B],
		-1, false);
	function inst_LDM_1 (inst, info)
	{
		doMultiple (
			this, inst, info,
			function (start_address, end_address, register_list, bank, mmu)
			{
				var address = start_address;
				for (var i = 0; i <= 14; i++)
				{
					if (register_list & (1 << i))
					{
						bank[i].set (mmu.read32 (address));
						address += 4;
					}
				}

				if (register_list & (1 << 15))
				{
					// FIXME: thumb?
					bank[CPU.Reg.PC].set (mmu.read32 (address) & ~0x3);
					address += 4;
				}
				
				if (end_address != address - 4)
					throw "LDM(1) memory assertion error";
			}
		);
	}

	Core.registerInstruction (inst_STM_1, [0x80, 0x82, 0x88, 0x8A, 0x90, 0x92, 0x98, 0x9A],
		-1, false);
	function inst_STM_1 (inst, info)
	{
		doMultiple (
			this, inst, info,
			function (start_address, end_address, register_list, bank, mmu)
			{
				var address = start_address;
				for (var i = 0; i <= 15; i++)
				{
					if (register_list & (1 << i))
					{
						mmu.write32 (address, bank[i].get ());
						address += 4;
					}
				}

				if (end_address != address - 4)
					throw "STM(1) memory assertion error";
			}
		);
	}

})();
