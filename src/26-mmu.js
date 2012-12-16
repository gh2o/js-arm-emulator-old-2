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
			if (this.cpu.creg.getM ())
				throw "translated mmu read not implemented";
			if ((address & 0x03) != 0)
				throw "unaligned mmu read not implemented";
			return this.pmem.read32 (address);
		},
		write32: function (address, data) {
			throw "mmu write not implemented";
		}
	};

	CPU.MMU = MMU;
})();
