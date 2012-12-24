(function () {

	var Core = CPU.Core;

	Core.registerInstruction (inst_SWP, 0x10, 9, false);
	function inst_SWP (inst, info)
	{
		var address = info.Rn.get ();
		if ((address & 0x03) && (this.creg._value & CPU.Control.A))
			throw "swp alignment fault";

		// assumed that U==0
		var temp = this.mmu.read32 (address & ~0x03);
		temp = Util.rotRight (temp, 8 * (address & 0x03));
		this.mmu.write32 (address & ~0x03, info.Rm.get ());
		info.Rd.set (temp);
	}

})();
