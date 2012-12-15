(function () {

	/** @const */ var BLOCK_BITS = 16;
	/** @const */ var BLOCK_SIZE = 1 << BLOCK_BITS;
	/** @const */ var NUM_BLOCKS = 0x100000000 / BLOCK_SIZE;

	function numBlock (x) { return x >>> BLOCK_BITS; }
	function numIndex (x) { return x & (BLOCK_SIZE - 1); }

	/** @constructor */
	function RAM ()
	{
		this.blocks = new Array (NUM_BLOCKS);
	}

	RAM.prototype = {
		read32: function (offset) {
			if ((offset & 0x03) == 0)
			{
				var block = this.blocks[numBlock(offset)];
				return block ? block[numIndex(offset) >> 2] : 0;
			}
			else
			{
				var b0 = this.read8 (offset + 0);
				var b1 = this.read8 (offset + 1);
				var b2 = this.read8 (offset + 2);
				var b3 = this.read8 (offset + 3);
				return ((b3 << 24) | (b2 << 16) | (b1 << 8) | (b0 << 0)) >>> 0;
			}
		},
		write32: function (offset, data) {
			if ((offset & 0x03) == 0)
			{
				var block = this.blocks[numBlock(offset)];
				if (!block)
				{
					block = new Uint32Array (BLOCK_SIZE / 4);
					this.blocks[numBlock(offset)] = block;
				}
				block[numIndex(offset) >> 2] = data;
			}
			else
			{
				this.write8 (offset + 0, (data >>>  0) & 0xff);
				this.write8 (offset + 1, (data >>>  8) & 0xff);
				this.write8 (offset + 2, (data >>> 16) & 0xff);
				this.write8 (offset + 3, (data >>> 24) & 0xff);
			}
		},
		read8: function (offset) {
			var base = offset & ~0x03;
			var sub = offset & 0x03;
			// if sub == 0, return lowest byte
			return (this.read32 (base) >>> (sub * 8)) & 0xFF;
		},
		write8: function (offset, data) {
			var base = offset & ~0x03;
			var sub = offset & 0x03;

			var shift = sub * 8;
			var mask = 0xFF << shift;
			data &= 0xFF;

			this.write32 (base, (this.read32 (base) & ~mask) | (data << shift));
		}
	};

	Mem.RAM = RAM;
})();
