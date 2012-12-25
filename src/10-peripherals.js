(function () {

	function Base () {}
	goog.mixin (Base.prototype, {
		read8: function (offset) {
			if (offset & 0x03)
				throw "unaligned 8-bit read from peripheral";
			else
				return this.read32 (offset) & 0xFF;
		},
		write8: function (offset, data) {
			if (offset & 0x03)
				throw "unaligned 8-bit write to peripheral";
			else
				this.write32 (offset, data & 0xFF);
		},
		read16: function (offset) {
			if (offset & 0x03)
				throw "unaligned 16-bit read from peripheral";
			else
				return this.read32 (offset) & 0xFFFF;
		},
		write16: function (offset, data) {
			if (offset & 0x03)
				throw "unaligned 16-bit write to peripheral";
			else
				this.write32 (offset, data & 0xFFFF);
		}
	});

	/**
	 * @enum {number}
	 */
	UART.Control = {
		RTS: 1 << 11,
		DTR: 1 << 10,
		RXE: 1 << 9,
		TXE: 1 << 8,
		LBE: 1 << 7,
		UARTEN: 1 << 0
	};
	Util.enumAll (UART.Control);

	// FIXME: loopback not implemented;

	/**
	 * @constructor
	 */
	function UART (start, callback)
	{
		this.start = start;
		this.size = 4096;
		this.callback = callback || (function () {});

		this.regControl = UART.Control.RXE | UART.Control.TXE | UART.Control.UARTEN;
		this.regLineControl = 0x60;

		this.regIntMask = 0;
		this.regIntStatus = 0;
		this.regIntFIFOSelect = 0;

		this.regBaudInt = 1;
		this.regBaudFrac = 0;
	}

	goog.inherits (UART, Base);
	Peripherals.UART = UART;

	UART.prototype.read32 = function (offset) {
		switch (offset)
		{
			case 0x18:
				return 0x40;
			case 0x24: // integer baud divisor
				return this.regBaudInt;
			case 0x28: // fractional baud divisor
				return this.regBaudFrac;
			case 0x2C:
				return this.regLineControl;
			case 0x30:
				return this.regControl;
			case 0x38:
				return this.regIntMask;
			case 0xFE0:
				return 0x11;
			case 0xFE4:
				return 0x10;
			case 0xFE8:
				return 0x14;
			case 0xFEC:
				return 0x00;
			case 0xFF0:
				return 0x0D;
			case 0xFF4:
				return 0xF0;
			case 0xFF8:
				return 0x05;
			case 0xFFC:
				return 0xB1;
			default:
				throw new Error ("bad UART read from 0x" + offset.toString (16));
		}
	};

	UART.prototype.write32 = function (offset, data) {
		switch (offset)
		{
			case 0x00:
				var cnt = this.regControl;
				if (
					(cnt & UART.Control.UARTEN) &&
					(cnt & UART.Control.TXE) &&
					!(cnt & UART.Control.LBE)
				)
					this.callback (data & 0xFF);
				break;
			case 0x24:
				this.regBaudInt = data;
				break;
			case 0x28:
				this.regBaudFrac = data;
				break;
			case 0x2c:
				this.regLineControl = data;
				break;
			case 0x30:
				if (data & ~UART.Control.ALL)
					throw "unsupported UART control: 0x" + data.toString (16);
				this.regControl = data;
				break;
			case 0x34:
				this.regIntFIFOSelect = data;
				break;
			case 0x38:
				this.regIntMask = data & 0x7FF;
				break;
			case 0x44:
				this.regIntStatus &= ~data;
				break;
			default:
				throw new Error ("bad UART write to 0x" + offset.toString (16));
		}
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

	/**
	 * @constructor
	 */
	function DualTimer (start, vic, irq)
	{
		/**
		 * @constructor
		 */
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

	Peripherals.DualTimer = DualTimer;

	DualTimer.prototype.read32 = function (offset) {
		if (offset < 0x40)
		{
			var timer = this.timers[offset >>> 5];
			switch (offset & 0x1F)
			{
				case 0x04:
					return timer.value;
				case 0x08:
					return timer.control;
				default:
					throw "bad timer read 0x" + offset.toString (16);
			}
		}
		else
		{
			throw "bad timer read 0x" + offset.toString (16);
		}
	};

	DualTimer.prototype.write32 = function (offset, data) {
		if (offset < 0x40)
		{
			var timer = this.timers[offset >>> 5];
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
				case 0x0C:
					this.vic.deassert (this.irq);
					break;
				default:
					throw "bad timer write 0x" + offset.toString (16);
			}
		}
		else
		{
			throw "bad timer write 0x" + offset.toString (16);
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
	// FIXME: vectored interrupts
	Peripherals.VIC = VIC;
	function VIC (start)
	{
		this.start = start;
		this.size = 65536;

		this.intLines = 0;

		this.regDefVectAddr = 0;
		this.regIntSelect = 0;
		this.regIntEnable = 0;
		this.regSoftLines = 0;

		this.regsVectCntl = [];
		for (var i = 0; i < 16; i++)
			this.regsVectCntl.push (0);
	}

	VIC.prototype.read32 = function (offset) {
		switch (offset)
		{
			case 0x00:
				return (this.intLines | this.regSoftLines) &
					this.regIntEnable & ~this.regIntSelect;
			case 0x04:
				return (this.intLines | this.regSoftLines) &
					this.regIntEnable & this.regIntSelect;
			case 0x08:
				return this.intLines | this.regSoftLines;
			case 0x30:
				// FIXME: read from vectaddr
				return this.regDefVectAddr;
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
				break;
			case 0x14:
				this.regIntEnable &= ~data;
				break;
			case 0x18:
				this.regSoftLines |= data;
				break;
			case 0x1C:
				this.regSoftLines &= ~data;
				break;
			case 0x30:
				// FIXME: write to vectaddr
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
