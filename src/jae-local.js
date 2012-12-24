function loadBuffer (mem, addr, buf)
{
	for (var off = 0; off < buf.length; off += 4)
	{
		mem.write32 (addr + off, buf.readUInt32LE (off, true));
	}
}

var pmem = new Mem.PhysicalMemory ();
pmem.addDevice (new Mem.RAM (0x0, 0x08000000));
pmem.addDevice (new Peripherals.SystemController (0x101e0000));
pmem.addDevice (new Peripherals.SystemRegisters (0x10000000, function () {
	var hrt = process.hrtime ();
	return (hrt[0] * 1000) + (hrt[1] / 1000000);
}));
pmem.addDevice (new Peripherals.UART (0x101f1000, function (data) {
	process.stdout.write (String.fromCharCode (data));
}));
pmem.addDevice (new Peripherals.VIC (0x10140000));
pmem.addDevice (new Peripherals.SIC (0x10003000));
pmem.addDevice (new Peripherals.DualTimer (0x101e2000));
pmem.addDevice (new Peripherals.DualTimer (0x101e3000));

var fs = require('fs');
loadBuffer (pmem, 0x00008000, fs.readFileSync('./resources/image'));
loadBuffer (pmem, 0x01000000, fs.readFileSync('./resources/board.dtb'));

var cpu = new CPU.Core (pmem);
cpu.pc.set (0x00008000);
cpu.getReg (0).set (0);
cpu.getReg (1).set (0);
cpu.getReg (2).set (0x01000000);
while (true)
{
	var pc = cpu.pc._value;
	/*
	if (pc >= 0xc0164304 && pc < 0xc01647b8)
		console.log (Util.hex32 (pc));
	*/
	cpu.tick ();
}
