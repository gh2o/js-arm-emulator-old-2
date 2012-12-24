function load (mem, addr, buf)
{
	for (var off = 0; off < buf.length; off += 4)
	{
		mem.write32 (addr + off, buf.readUInt32LE (off, true));
	}
}

var board = new Board ();

board.uartWrite = function (data) {
	process.stdout.write (String.fromCharCode (data));
};
board.getMilliseconds = function () {
	var hrt = process.hrtime ();
	return (hrt[0] * 1000) + (hrt[1] / 1000000);
};

var fs = require ('fs');
load (board.pmem, 0x00008000, fs.readFileSync('./resources/image'));
load (board.pmem, 0x01000000, fs.readFileSync('./resources/board.dtb'));

board.cpu.pc.set (0x00008000);
board.cpu.getReg (0).set (0);
board.cpu.getReg (1).set (0);
board.cpu.getReg (2).set (0x01000000);
while (true)
	board.tick ();
