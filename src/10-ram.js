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
				throw 'unaligned RAM read';
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
				throw 'unaligned RAM write';
			}
		}
	};

	Mem.RAM = RAM;
})();
