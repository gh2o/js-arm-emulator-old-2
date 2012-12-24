var Board = (function () {

	function Board ()
	{
		var me = this;

		var pmem = this.pmem = new Mem.PhysicalMemory ();

		var vic = this.vic = new Peripherals.VIC (0x10140000);
		var sic = this.sic = new Peripherals.SIC (0x10003000);
		pmem.addDevice (new Mem.RAM (0x0, 0x08000000));
		pmem.addDevice (vic);
		pmem.addDevice (sic);
		pmem.addDevice (new Peripherals.SystemController (0x101e0000));
		pmem.addDevice (new Peripherals.SystemRegisters (0x10000000,
			function () { return me.getMilliseconds.apply (null, arguments); }));
		pmem.addDevice (new Peripherals.UART (0x101f1000,
			function () { me.uartWrite.apply (null, arguments); }));
		var timer1 = this.timer1 = new Peripherals.DualTimer (0x101e2000, vic);
		var timer2 = this.timer2 = new Peripherals.DualTimer (0x101e3000, vic);
		pmem.addDevice (timer1);
		pmem.addDevice (timer2);

		var cpu = this.cpu = new CPU.Core (pmem, vic);
	}

	Board.prototype.uartWrite = function () {
		throw new Error ("uartWrite not implemented");
	};

	Board.prototype.getMilliseconds = function () {
		throw new Error ("getMilliseconds not implemented");
	};

	Board.prototype.tick = function () {
		var cpu = this.cpu;
		this.timer1.update ();
		this.timer2.update ();
		cpu.tick ();
	};

	return Board;

})();
