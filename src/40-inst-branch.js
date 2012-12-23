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

})();
