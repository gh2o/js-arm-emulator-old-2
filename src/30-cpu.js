(function () {

	var uncondTable = [];
	var condTable = [];

	function evaluateCondition (cond, cpsr)
	{
		var val = cpsr._value;
		var N = !!(val & (1 << 31));
		var Z = !!(val & (1 << 30));
		var C = !!(val & (1 << 29));
		var V = !!(val & (1 << 28));

		switch (cond)
		{
			case 0: return Z;
			case 1: return !Z;
			case 2: return C;
			case 3: return !C;
			case 4: return N;
			case 5: return !N;
			case 6: return V;
			case 7: return !V;
			case 8: return C && !Z;
			case 9: return !C || Z;
			case 10: return N == V;
			case 11: return N != V;
			case 12: return !Z && (N == V);
			case 13: return Z || (N != V);
			case 14: return true;
			default: throw "unhandled condition";
		}
	}

	var Core = CPU.Core;

	Core.prototype.tick = function () {
		var inst = this.mmu.read32 (this.pc._value);
		this.pc._value += 4;

		var table = uncondTable;
		var cond = inst >>> 28;
		if (cond == 0x0F)
		{
			table = uncondTable;
		}
		else
		{
			table = condTable;
			if (!evaluateCondition (cond, this.cpsr))
				return;
		}

		var ident1 = (inst >>> 20) & 0xFF;
		var ident2 = (inst >>> 4) & 0x0F;

		var func = table[ident1];
		if (func instanceof Array)
			func = func[ident2];

		if (!func)
		{
			var msg = 'undefined instruction: ' + Util.hex32 (inst);
			console.log (msg);
			console.log ('ident1 = 0x' + ident1.toString (16));
			console.log ('ident2 = 0x' + ident2.toString (16));
			throw msg;
		}

		func.call (this, inst);
	};

})();
