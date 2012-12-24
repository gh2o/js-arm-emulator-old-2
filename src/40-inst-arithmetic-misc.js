(function () {

	var Core = CPU.Core;

	Core.registerInstruction (inst_CLZ, 0x16, 1, false);
	function inst_CLZ (inst, info)
	{
		var x = info.Rm.get ();

		x |= x >>> 1;
		x |= x >>> 2;
		x |= x >>> 4;
		x |= x >>> 8;
		x |= x >>> 16;

		x -= (x >>> 1) & 0x55555555;
		x = ((x >>> 2) & 0x33333333) + (x & 0x33333333);
		x = ((x >>> 4) + x) & 0x0F0F0F0F;
		x = ((x >>> 8) + x) & 0x00FF00FF;
		x = ((x >>> 16) + x) & 0x0000FFFF;

		info.Rd.set (32 - x);
	}

})();
