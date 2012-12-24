(function () {

	var Core = CPU.Core;

	var coprocessors = [];

	coprocessors[15] = {
		read: function (cpu, n, m, o1, o2) {
			if (n == 0)
			{
				if (o2 == 0)
				{
					// system ID
					return 0x41069260;
				}
				else if (o2 == 1)
				{
					// cache type (none)
					return 0x01004004;
				}
			}
			else if (n == 1)
			{
				if (o2 == 0)
				{
					return cpu.creg._value;
				}
			}
			else if (n == 7)
			{
				if (m == 14 && o2 == 3)
				{
					// test, clean, and invalidate data cache
					return CPU.Status.ALL;
				}
			}
			throw "bad CP15 read: n=" + n + ", m=" + m +
				", o1=" + o1 + ", o2=" + o2;
		},
		write: function (cpu, n, m, o1, o2, data) {
			if (n == 1)
			{
				if (o2 == 0)
				{
					if (data & ~CPU.Control.ALL)
					{
						throw "attempted to set undefined control bits: " +
							Util.hex32 (data & ~CPU.Control.ALL);
					}
					cpu.creg._value = data;
					return;
				}
			}
			else if (n == 2)
			{
				cpu.mmu.regTable = data;
				return;
			}
			else if (n == 3)
			{
				cpu.mmu.regDomain = data;
				return;
			}
			else if (n == 7)
			{
				if (m == 5 && o2 == 0)
				{
					// FIXME: invalidate entire instruction cache
					return;
				}
				else if (m == 5 && o2 == 1)
				{
					// FIXME: invalidate instruction cache line (MVA)
					return;
				}
				else if (m == 7 && o2 == 0)
				{
					// FIXME: invalidate all caches
					return;
				}
				else if (m == 10 && o2 == 1)
				{
					// FIXME: clean data cache line (MVA)
					return;
				}
				else if (m == 10 && o2 == 2)
				{
					// FIXME: clean data cache line (set/way)
					return;
				}
				else if (m == 10 && o2 == 4)
				{
					// FIXME: data sync barrier
					return;
				}
				else if (m == 14 && o2 == 1)
				{
					// FIXME: clean and invalidate data cache line (MVA)
					return;
				}
			}
			else if (n == 8)
			{
				if (m == 5 && o2 == 0)
				{
					// FIXME: invalidate entire instruction TLB
					return;
				}
				else if (m == 6 && o2 == 0)
				{
					// FIXME: invalidate entire data TLB
					return;
				}
				else if (m == 6 && o2 == 2)
				{
					// FIXME: invalidate on ASID match data TLB
					return;
				}
				else if (m == 7 && o2 == 0)
				{
					// FIXME: invalidate all TLBs
					return;
				}
			}
			throw "bad CP15 write: n=" + n + ", m=" + m +
				", o1=" + o1 + ", o2=" + o2;
		}
	};

	Core.registerInstruction (inst_MRC,
		[0xE1, 0xE3, 0xE5, 0xE7, 0xE9, 0xEB, 0xED, 0xEF],
		[1, 3, 5, 7, 9, 11, 13, 15],
		false
	);
	function inst_MRC (inst, info)
	{
		var cp_num = (inst >>> 8) & 0x0F;
		var opcode_1 = (inst >>> 21) & 0x07;
		var CRn = info.Rn.index;
		var CRm = info.Rm.index;
		var opcode_2 = (inst >>> 5) & 0x07;

		var coprocessor = coprocessors[cp_num];
		if (!coprocessor)
			throw "bad coprocessor number";

		var Rd = info.Rd;
		var data = coprocessor.read (this, CRn, CRm, opcode_1, opcode_2);
		if (Rd.index == CPU.Reg.PC)
		{
			var mask = CPU.Status.ALL;
			var cpsr = this.cpsr;
			cpsr._value = (cpsr._value & ~mask) | (data & mask);
		}
		else
		{
			info.Rd.set (data);
		}
	}

	Core.registerInstruction (inst_MCR,
		[0xE0, 0xE2, 0xE4, 0xE6, 0xE8, 0xEA, 0xEC, 0xEE],
		[1, 3, 5, 7, 9, 11, 13, 15],
		false
	);
	function inst_MCR (inst, info)
	{
		var cp_num = (inst >>> 8) & 0x0F;
		var opcode_1 = (inst >>> 21) & 0x07;
		var CRn = info.Rn.index;
		var CRm = info.Rm.index;
		var opcode_2 = (inst >>> 5) & 0x07;

		var coprocessor = coprocessors[cp_num];
		if (!coprocessor)
			throw "bad coprocessor number";

		coprocessor.write (this, CRn, CRm, opcode_1, opcode_2, info.Rd.get ());
	}

})();
