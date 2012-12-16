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
loadBuffer (pmem, 0x01000000, fs.readFileSync('./kernel/image'));
loadBuffer (pmem, 0x02000000, fs.readFileSync('./kernel/board.dtb'));

var cpu = new CPU.Core ();
