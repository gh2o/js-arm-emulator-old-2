(function () {

	var Core = CPU.Core;

	Core.registerInstruction (inst_B, {first: 0xa0, last: 0xaf}, -1, false);
	function inst_B (inst, info)
	{
		var offset = (inst << 8) >> 6;
		this.pc.set (this.pc.get () + offset);
	}

	Core.registerInstruction (inst_BL, {first: 0xb0, last: 0xbf}, -1, false);
	function inst_BL (inst, info)
	{
		var offset = (inst << 8) >> 6;
		this.getReg (CPU.Reg.LR).set (this.pc._value);
		this.pc.set (this.pc.get () + offset);
	}

	Core.registerInstruction (inst_BX, 0x12, 1, false);
	function inst_BX (inst, info)
	{
		// FIXME: thumb?
		this.pc.set (info.Rm.get () & ~0x03);
	}

	Core.registerInstruction (inst_BLX, 0x12, 3, false);
	function inst_BLX (inst, info)
	{
		// FIXME: thumb?
		this.getReg (CPU.Reg.LR).set (this.pc._value);
		this.pc.set (info.Rm.get () & ~0x03);
	}

})();
