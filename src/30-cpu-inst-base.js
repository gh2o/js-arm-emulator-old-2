(function () {

	var Core = CPU.Core;

	var instructionTable = Core.instructionTable = [];

	Core.registerInstruction = function (func, ident1, ident2, uncond) {

		if (typeof ident1 === 'object')
		{
			if (ident1.first && ident1.last)
			{
				for (var i = ident1.first; i <= ident1.last; i++)
					Core.registerInstruction (func, i, ident2, uncond);
			}
			else
			{
				for (var i = 0; i < ident1.length; i++)
					Core.registerInstruction (func, ident1[i], ident2, uncond);
			}
			return;
		}

		if (typeof ident2 === 'object')
		{
			if (ident2.first && ident2.last)
			{
				for (var i = ident2.first; i <= ident2.last; i++)
					Core.registerInstruction (func, ident1, i, uncond);
			}
			else
			{
				for (var i = 0; i < ident2.length; i++)
					Core.registerInstruction (func, ident1, ident2[i], uncond);
			}
			return;
		}

		if (ident2 < 0)
		{
			for (var i = 0; i < 16; i++)
				Core.registerInstruction (func, ident1, i, uncond);
			return;
		}

		uncond = Boolean (uncond);
		var ident = (uncond << 12) | (ident1 << 4) | (ident2);

		if (instructionTable[ident] && instructionTable[ident] !== func)
			throw "reregistration of instruction!";
		instructionTable[ident] = func;
	};

})();
