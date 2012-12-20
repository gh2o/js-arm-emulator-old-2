var resourcesList = ["image", "board.dtb"];
var resources = {};
resourcesList.forEach (loadResource);

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
	{
		if (!resources[resourcesList[i]])
		{
			return;
		}
	}

	function load (mem, addr, buf)
	{
		var view = new Uint32Array (buf);
		for (var off = 0; off < buf.byteLength; off += 4)
			mem.write32 (addr + off, view[off / 4]);
	}

	pmem = new Mem.PhysicalMemory ();
	pmem.addDevice (new Mem.RAM (0x0, 0x08000000));

	load (pmem, 0x01000000, resources['image']);
	load (pmem, 0x02000000, resources['board.dtb']);

	var cpu = new CPU.Core (pmem);
	cpu.pc.set (0x01000000);
	while (true)
			cpu.tick ();
}
