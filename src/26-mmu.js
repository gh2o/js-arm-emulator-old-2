(function () {

	/**
	 * @constructor
	 */
	function MMU (cpu, pmem)
	{
		this.cpu = cpu;
		this.pmem = pmem;
	}

	MMU.prototype = {
		read32: function (address) {
			if (this.cpu.creg._value & CPU.Control.M)
				throw "translated mmu read not implemented";
			if ((address & 0x03) != 0)
				throw "unaligned mmu read not implemented";
			return this.pmem.read32 (address);
		},
		write32: function (address, data) {
			if (this.cpu.creg._value & CPU.Control.M)
				throw "translated mmu write not implemented";
			if ((address & 0x03) != 0)
				throw "unaligned mmu write not implemented";
			this.pmem.write32 (address, data);
		}
	};

	CPU.MMU = MMU;
})();
