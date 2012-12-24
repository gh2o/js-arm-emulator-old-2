(function () {

	Util.hex32 = hex32;
	function hex32 (x)
	{
		var ret = x.toString (16);
		while (ret.length < 8)
			ret = "0" + ret;
		return ret;
	}

	Util.rotRight = rotRight;
	function rotRight (val, sht)
	{
		return ((val >>> sht) | (val << (32 - sht))) >>> 0;
	}

	Util.enumAll = enumAll;
	function enumAll (obj)
	{
		var all = 0;
		for (var x in obj)
			if (obj.hasOwnProperty (x))
				all |= obj[x];
		obj.ALL = all;
	}

})();
