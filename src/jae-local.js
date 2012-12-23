function loadBuffer (mem, addr, buf)
{
	for (var off = 0; off < buf.length; off += 4)
	{
		mem.write32 (addr + off, buf.readUInt32LE (off, true));
	}
}

var pmem = new Mem.PhysicalMemory ();
pmem.addDevice (new Mem.RAM (0x0, 0x08000000));

var fs = require('fs');
loadBuffer (pmem, 0x01008000, fs.readFileSync('./resources/image'));
loadBuffer (pmem, 0x02000000, fs.readFileSync('./resources/board.dtb'));

var cpu = new CPU.Core (pmem);
cpu.pc.set (0x01008000);
cpu.getReg (0).set (0);
cpu.getReg (1).set (0);
cpu.getReg (2).set (0x02000000);
while (true)
{
	console.log ("executing " + Util.hex32 (cpu.pc._value));
	cpu.tick ();
	/*
	if (cpu.pc._value == 0x0115c27c)
	{
		console.log ("kernel error occured!");
		break;
	}
	*/
}
