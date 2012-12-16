(function () {

	/**
	 * @constructor
	 */
	function Core (pmem)
	{
		goog.base (this, pmem);
	}

	goog.inherits (Core, CPU.CoreBase);

	CPU.Core = Core;

})();
