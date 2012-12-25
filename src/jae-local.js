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
load (board.pmem, 0x01200000, fs.readFileSync('./resources/rootfs.cpio'));

board.cpu.pc.set (0x00008000);
board.cpu.getReg (0).set (0);
board.cpu.getReg (1).set (0);
board.cpu.getReg (2).set (0x01000000);

while (true)
	board.tick ();

/*
var sc = 0;
try {
	while (true)
	{
		var rg = sc > 9585000;
		if (rg) console.log ("executing " + Util.hex32 (board.cpu.pc._value));
		board.tick ();
		if (rg) board.cpu.dumpRegisters ();
		sc++;
	}
} catch (e) {
	console.log ('!!! instruction count: ' + sc);
	throw e;
}
*/

/*
var pcs = new Array (2000);
var pcsi = 0;

try {
	while (true)
	{
		pcs[pcsi] = [board.cpu.pc._value];
		pcsi = (pcsi + 1) % 2000;
		board.tick ();
	}
} catch (e) {
	pcs.slice (pcsi).concat (pcs.slice (0, pcsi)).forEach (function (x) {
		console.log (Util.hex32 (x));
	});
	throw e;
}
*/
