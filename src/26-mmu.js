(function () {

	/**
	 * @constructor
	 */
	function DataAbort (address, status, domain, msg)
	{
		goog.base (this, msg);
		this.address = address;
		this.status = status;
		this.domain = domain;
	}

	goog.inherits (DataAbort, Util.Error);
	CPU.DataAbort = DataAbort;

	/**
	 * @constructor
	 */
	function MMU (cpu, pmem)
	{
		this.cpu = cpu;
		this.pmem = pmem;

		this.regDomain = 0;
		this.regTable = 0;
		this.regFaultStatus = 0;
		this.regFaultAddress = 0;
	}

	MMU.prototype = {

		read8: function (address, user) {
			address = this.translate (address, false, user);
			return this.pmem.read8 (address) & 0xFF;
		},

		write8: function (address, data, user) {
			address = this.translate (address, true, user);
			this.pmem.write8 (address, data & 0xFF);
		},

		read16: function (address, user) {
			if ((address & 0x01) != 0)
				throw "unaligned 16-bit mmu read";
			address = this.translate (address, false, user);
			return this.pmem.read16 (address) & 0xFFFF;
		},

		write16: function (address, data, user) {
			if ((address & 0x01) != 0)
				throw "unaligned 16-bit mmu write";
			address = this.translate (address, true, user);
			this.pmem.write16 (address, data & 0xFFFF);
		},

		read32: function (address, user) {
			if ((address & 0x03) != 0)
				throw "unaligned 32-bit mmu read";
			address = this.translate (address, false, user);
			return this.pmem.read32 (address);
		},

		write32: function (address, data, user) {
			if ((address & 0x03) != 0)
				throw "unaligned 32-bit mmu write";
			address = this.translate (address, true, user);
			this.pmem.write32 (address, data >>> 0);
		},

		translate: function () {
			try {
				return this._translate.apply (this, arguments);
			} catch (e) {
				if (e instanceof DataAbort)
				{
					this.regFaultStatus =
						((e.domain & 0xF) << 4) | (e.status & 0xF);
					this.regFaultAddress = e.address;
				}
				throw e;
			}
		},

		_translate: function (inAddr, write, user) {

			inAddr >>>= 0;
			if (!(this.cpu.creg._value & CPU.Control.M))
				return inAddr;

			var firstDescAddr = (
				(this.regTable & 0xffffc000) |
				((inAddr >>> 18) & ~0x03)
			) >>> 0;
			var firstDesc = this.pmem.read32 (firstDescAddr);

			var domain = (firstDesc >>> 5) & 0x0F;
			var ap;
			var outAddr;

			var firstType = firstDesc & 0x03;
			switch (firstType)
			{
				case 0:
					throw new DataAbort (inAddr, 0x5, domain, "first level translation fault");
				case 2: // section
					ap = (firstDesc >>> 10) & 0x03;
					outAddr = (firstDesc & 0xFFF00000) | (inAddr & 0x000FFFFF);
					break;
				default:
					var secondDescAddr = (
						firstType == 1 ?
							(
							 	// coarse
							 	(firstDesc & 0xfffffc00) |
								((inAddr >>> 10) & 0x03fc)
							)
							:
							(
							 	// fine
								(firstDesc & 0xfffff000) |
								((inAddr >>> 8) & 0x0ffc)
							)
					) >>> 0;
					var secondDesc = this.pmem.read32 (secondDescAddr);
					var secondType = secondDesc & 0x03;
					switch (secondType)
					{
						case 0:
							throw new DataAbort (inAddr, 0x7, domain, "second level translation fault");
						case 2: // small page
							outAddr = (secondDesc & 0xfffff000) | (inAddr & 0x0fff);
							var qt = (outAddr >>> 10) & 0x03;
							ap = (secondDesc >>> (4 + 2 * qt)) & 0x03;
							break;
						default:
							throw "unimplemented second level type";
					}
					break;
			}

			// permission checks
			var domainType = (this.regDomain >> (2 * domain)) & 0x03;
			switch (domainType)
			{
				case 0:
				case 2:
					throw new DataAbort (
						inAddr,
						(firstType == 2) ? 0x9 : 0xB,
						domain, "domain fault"
					);
				case 3: // manager
					break;
				case 1: // client
					var priv = !user && (this.cpu.cpsr.getMode () != CPU.Mode.USR);
					var allowed;
					switch (ap)
					{
						case 0:
							var rs = (this.cpu.creg._value >>> 8) & 0x03;
							switch (rs)
							{
								case 0: // R=0, S=0
									allowed = false;
									break;
								case 1: // R=0, S=1
									allowed = priv && !write;
									break;
								case 2: // R=1, S=0
									allowed = !write;
									break;
								case 3: // R=1, S=1
									throw "bad RS";
									break;
							}
							break;
						case 1:
							allowed = priv;
							break;
						case 2:
							allowed = priv || !write;
							break;
						case 3:
							allowed = true;
							break;
					}
					if (!allowed)
						throw new DataAbort (
							inAddr,
							(firstType == 2) ? 0xD : 0xF,
							domain, "permission fault"
						);
					break;
			}

			return outAddr >>> 0;
		}
	};

	CPU.MMU = MMU;
})();
