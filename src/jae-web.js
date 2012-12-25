var resourcesList = ["image", "board.dtb"];
var resources = {};
resourcesList.forEach (loadResource);

var board = null;

function loadResource (rsrc)
{
	var xhr = new XMLHttpRequest ();
	xhr.onreadystatechange = function (evt) {
		if (xhr.readyState == 4)
		{
			if (xhr.response)
			{
				resources[rsrc] = xhr.response;
				start ();
			}
			else
			{
				loadResource (rsrc);
			}
		}
	};
	xhr.open ('GET', 'resources/' + rsrc);
	xhr.responseType = 'arraybuffer';
	xhr.send ();
}

function start ()
{
	for (var i = 0; i < resourcesList.length; i++)
		if (!resources[resourcesList[i]])
			return;

	var littleEndian =
		(new Uint8Array (new Uint16Array ([1]).buffer)[0] == 1);

	var swap = littleEndian ?
		function (x) { return x; } :
		function (x) {
			return (
				((x <<  24) & 0xFF000000) |
				((x <<   8) & 0x00FF0000) |
				((x >>>  8) & 0x0000FF00) |
				((x >>> 24) & 0x000000FF)
			) >>> 0;
		};

	function load (mem, addr, buf)
	{
		var view = new Uint32Array (buf);
		for (var off = 0; off < buf.byteLength; off += 4)
			mem.write32 (addr + off, swap (view[off >> 2]));
	}

	board = new Board ();

	var uartCount = 0;
	board.uartWrite = function (code) {
		var node = document.createTextNode (String.fromCharCode (code));
		var output = document.getElementById ('output');
		output.appendChild (node);
		if (uartCount++ % 256 == 0)
			output.normalize ();
	};

	var perf = (typeof performance !== "undefined") ? performance : {};
	board.getMilliseconds = 
		perf.now ? function () { return perf.now (); } :
		perf.webkitNow ? function () { return perf.webkitNow (); } :
		function () { return (new Date).getTime (); };

	load (board.pmem, 0x00008000, resources['image']);
	load (board.pmem, 0x01000000, resources['board.dtb']);

	board.cpu.pc.set (0x00008000);
	board.cpu.getReg (0).set (0);
	board.cpu.getReg (1).set (0);
	board.cpu.getReg (2).set (0x01000000);

	insts = 1000;
	var runs = 0;

	var iid = setInterval (function () {
		try {
			var prof = (runs % 100 == 0);
			var start, end;

			if (prof)
				start = (new Date).getTime ();
			for (var i = 0; i < insts; i++)
				board.tick ();
			if (prof)
			{
				end = (new Date).getTime ();
				var elapsed = end - start;
				if (elapsed < 15)
					insts *= 1.05;
				else
					insts /= 1.05;
			}

			runs++;
		} catch (e) {
			clearInterval (iid);
			throw e;
		}
	}, 5);
}
