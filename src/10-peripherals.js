(function () {

	function UART (start, callback)
	{
		this.start = start;
		this.size = 4096;
		this.callback = callback || (function () {});
	}

	UART.prototype = {
		read32: function (offset) {
			if (offset == 24)
				return 0x40;
			else
				throw "bad UART register " + offset;
		},
		write8: function (offset, data) {
			if (offset == 0)
				this.callback (data);
			else
				throw "bad UART register " + offset;
		},
	};

	Peripherals.UART = UART;

})();
