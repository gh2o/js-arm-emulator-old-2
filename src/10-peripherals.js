(function () {

	Peripherals.UART = UART;
	function UART (start, callback)
	{
		this.start = start;
		this.size = 4096;
		this.callback = callback || (function () {});
	}

	UART.prototype.read32 = function (offset) {
		if (offset == 0x18)
			return 0x40;
		else
			throw "bad UART register " + offset;
	};

	UART.prototype.write8 = function (offset, data) {
		if (offset == 0)
			this.callback (data);
		else
			throw "bad UART register " + offset;
	};

	Peripherals.SystemRegisters = SystemRegisters;
	function SystemRegisters (start, mscallback)
	{
		this.start = start;
		this.size = 4096;
		this.mscallback = mscallback;

		this.sys24clk = 0;
		this.sys24ms = 0;
	}

	SystemRegisters.prototype.read32 = function (offset) {
		if (offset == 0x5c)
		{
			var ms = this.mscallback ();
			var dms = ms - this.sys24ms;
			this.sys24ms = ms;

			var clk = this.sys24clk =
				(this.sys24clk + dms * 24000) % 0x100000000;
			return clk >>> 0;
		}
		else
		{
			throw "bad system register " + offset;
		}
	}

	Peripherals.SystemController = SystemController;
	function SystemController (start)
	{
		this.start = start;
		this.size = 4096;
	}

	SystemController.prototype.read32 = function (offset) {
		switch (offset)
		{
			case 0x00: // no clue what this is ...
				return 0;
			default:
				throw "bad system controller register " + offset;
		}
	};

	SystemController.prototype.write32 = function (offset) {
		switch (offset)
		{
			case 0x00:
				console.log (">>> FIXME: write to sys controller base");
				break;
			default:
				throw "bad system controller register " + offset;
		}
	};

	Peripherals.DualTimer = DualTimer;
	function DualTimer (start, vic, irq)
	{
		function Timer () {}
		Timer.prototype = {

			control: 0,
			load: 0,
			value: 0xFFFFFFFF,

			psc: 0,
			halted: false

		};

		this.start = start;
		this.size = 4096;
		this.timers = [new Timer (), new Timer ()];

		this.vic = vic;
		this.irq = irq;
	}

	DualTimer.prototype.write32 = function (offset, data) {
		if (offset < 0x40)
		{
			timer = this.timers[offset >>> 5];
			switch (offset & 0x1f)
			{
				case 0x00:
					timer.load = data;
					timer.value = data;
					timer.halted = false;
					break;
				case 0x04:
					timer.value = data;
					break;
				case 0x08:
					timer.control = data & 0xFF;
					timer.halted = false;
					break;
				default:
					throw "bad timer register " + offset;
			}
		}
		else
		{
			throw "bad timer register " + offset;
		}
	};

	DualTimer.prototype.update = function () {
		var timers = this.timers;
		this._update (timers[0]);
		this._update (timers[1]);
	};

	DualTimer.prototype._update = function (timer) {

		/** @const */ var ENABLED = 0x80;
		/** @const */ var PERIODIC = 0x40;
		/** @const */ var INTENABLED = 0x20;
		/** @const */ var BITS32 = 0x02;
		/** @const */ var ONESHOT = 0x01;

		var cnt = timer.control;
		var mask = (cnt & BITS32) ? 0xFFFFFFFF : 0xFFFF;

		// return if not enabled or halted
		if (!(cnt & ENABLED) || timer.halted)
			return;

		// prescale
		var psb = (cnt >>> 2) & 0x03;
		var psm = 1 << (4 * psb);
		if (++timer.psc >= psm)
			timer.psc = 0;
		else
			return;
		
		// check if zero
		if ((timer.value & mask) == 0)
		{
			if (cnt & INTENABLED)
				this.vic.assert (this.irq);

			if (cnt & ONESHOT)
				timer.halted = true;
			else if (cnt & PERIODIC)
				timer.value = timer.load;
			else
				timer.value = 0xFFFFFFFF;
		}
		else
		{
			timer.value = (timer.value - 1) >>> 0;
		}
	};

	// FIXME: VIC protection
	Peripherals.VIC = VIC;
	function VIC (start)
	{
		this.start = start;
		this.size = 65536;

		this.intLines = 0;

		this.regDefVectAddr = 0;
		this.regVectAddr = 0;
		this.regIntEnable = 0;
		this.regSoftEnable = 0;
		this.regIntSelect = 0;

		this.flagProtection = false;

		this.regsVectCntl = [];
		for (var i = 0; i < 16; i++)
			this.regsVectCntl.push (0);
	}

	VIC.prototype.read32 = function (offset) {
		switch (offset)
		{
			case 0x30:
				console.log (">>> FIXME: read from vectaddr");
				return this.regVectAddr;
			case 0xFE0:
				return 0x90;
			case 0xFE4:
				return 0x11;
			case 0xFE8:
				return 0x04;
			case 0xFEC:
				return 0x00;
			default:
				throw "bad VIC read " + offset;
		}
	};

	VIC.prototype.write32 = function (offset, data) {
		switch (offset)
		{
			case 0x0C:
				if (data != 0)
					throw "VIC FIQs not implemented";
				break;
			case 0x10:
				this.regIntEnable |= data;
				console.log ("=== intenable[1] now " + Util.hex32 (this.regIntEnable >>> 0));
				break;
			case 0x14:
				this.regIntEnable &= ~data;
				console.log ("=== intenable[2] now " + Util.hex32 (this.regIntEnable >>> 0));
				break;
			case 0x1C:
				this.regSoftEnable &= ~data;
				break;
			case 0x30:
				console.log (">>> FIXME: write to vectaddr");
				this.regVectAddr = data;
				break;
			case 0x34:
				this.regDefVectAddr = data;
				break;
			case 0x0300:
				if (data & 1)
					throw "VIC test mode not implemented";
				break;
			default:
				if (offset >= 0x200 && offset < 0x240)
				{
					var index = (offset - 0x200) >> 2;
					this.regsVectCntl[index] = data;
					break;
				}
				throw "bad VIC write " + offset + " (" + Util.hex32 (data) + ")";
		}
	};

	VIC.prototype.assert = function (line) { this.intLines |= (1 << line); };
	VIC.prototype.deassert = function (line) { this.intLines &= ~(1 << line); };

	Peripherals.SIC = SIC;
	function SIC (start)
	{
		this.start = start;
		this.size = 4096;

		this.regEnable = 0;
		this.regPICEnable = 0;
	}

	SIC.prototype.write32 = function (offset, data) {
		switch (offset)
		{
			case 0x0C:
				this.regEnable &= ~data;
				break;
			case 0x20:
				this.regPICEnable |= data;
				break;
			default:
				throw "bad SIC write " + offset + " (" + Util.hex32 (data) + ")";
		}
	};

})();
