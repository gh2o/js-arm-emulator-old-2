(function () {

	/** @constructor */
	function PhysicalMemory ()
	{
		this.devices = [];
	}

	PhysicalMemory.prototype = {
		addDevice: function (device) {
			this.devices.push (device);
		},
		findDevice: function (address) {
			var devs = this.devices;
			for (var i = 0; i < devs.length; i++)
			{
				var dev = devs[i];
				var start = dev.start;
				var size = dev.size;
				if (address >= start && address < start + size)
				{
					return dev;
				}
			}
			throw "undefined access to physical location " + Util.hex32 (address);
		},
		read32: function (address) {
			if ((address & 0x03) != 0)
				throw "unaligned physical read";
			var dev = this.findDevice (address);
			return dev.read32 (address - dev.start);
		},
		write32: function (address, data) {
			if ((address & 0x03) != 0)
				throw "unaligned physical write";
			var dev = this.findDevice (address);
			dev.write32 (address - dev.start, data);
		}
	};

	Mem.PhysicalMemory = PhysicalMemory;

})();
