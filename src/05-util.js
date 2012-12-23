(function () {

	function hex32 (x)
	{
		var ret = x.toString (16);
		while (ret.length < 8)
			ret = "0" + ret;
		return ret;
	}

	Util.hex32 = hex32;

	function rotRight (val, sht)
	{
		return ((val >>> sht) | (val << (32 - sht))) >>> 0;
	}

	Util.rotRight = rotRight;

})();
