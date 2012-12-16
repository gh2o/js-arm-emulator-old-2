(function () {

	/**
	 * @constructor
	 */
	function Core (pmem)
	{
		goog.base (this, pmem);
	}

	goog.inherits (Core, CPU.CoreBase);
	var cp = Core.prototype;

	cp.tick = function () {
		var inst = this.mmu.read32 (this.pc._value);
		this.pc._value += 4;

		console.log (Util.hex32 (inst));
		throw "haha";
	};

	CPU.Core = Core;

})();
