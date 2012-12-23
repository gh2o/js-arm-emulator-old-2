(function () {

	/** @const */ var BLOCK_BITS = 16;
	/** @const */ var BLOCK_SIZE = 1 << BLOCK_BITS;
	/** @const */ var NUM_BLOCKS = 0x100000000 / BLOCK_SIZE;

	function numBlock (x) { return x >>> BLOCK_BITS; }
	function numIndex (x) { return x & (BLOCK_SIZE - 1); }

	/** @constructor */
	function RAM (start, size)
	{
		this.blocks = new Array (NUM_BLOCKS);
		this.start = start;
		this.size = size;
	}

	RAM.prototype = {
		read8: function (offset) {
			var base = offset & ~0x03, index = offset & 0x03, shift = index * 8;
			return (this.read32 (base) >>> shift) & 0xFF;
		},
		write8: function (offset, data) {
			var base = offset & ~0x03, index = offset & 0x03, shift = index * 8;
			var val = this.read32 (base);
			val = (val & ~(0xFF << shift)) | ((data & 0xFF) << shift);
			this.write32 (base, val);
		},
		read16: function (offset) {
			if (offset & 0x01)
				throw 'unaligned 16-bit RAM read';
			var base = offset & ~0x03, index = offset & 0x03, shift = index * 8;
			return (this.read32 (base) >>> shift) & 0xFFFF;
		},
		write16: function (offset, data) {
			if (offset & 0x01)
				throw 'unaligned 16-bit RAM write';
			var base = offset & ~0x03, index = offset & 0x03, shift = index * 8;
			var val = this.read32 (base);
			val = (val & ~(0xFFFF << shift)) | ((data & 0xFFFF) << shift);
			this.write32 (base, val);
		},
		read32: function (offset) {
			if ((offset & 0x03) != 0)
				throw 'unaligned 32-bit RAM read';
			var block = this.blocks[numBlock(offset)];
			return block ? block[numIndex(offset) >> 2] : 0;
		},
		write32: function (offset, data) {
			if ((offset & 0x03) != 0)
				throw 'unaligned 32-bit RAM write';
			var block = this.blocks[numBlock(offset)];
			if (!block)
			{
				block = new Uint32Array (BLOCK_SIZE / 4);
				this.blocks[numBlock(offset)] = block;
			}
			block[numIndex(offset) >> 2] = data;
		}
	};

	Mem.RAM = RAM;
})();
