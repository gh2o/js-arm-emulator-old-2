(function () {

	/**
	 * @enum {number}
	 */
	var Mode = {
		USR: 0x10,
		FIQ: 0x11,
		IRQ: 0x12,
		SVC: 0x13,
		ABT: 0x17,
		UND: 0x1b,
		SYS: 0x1f
	};

	CPU.Mode = Mode;

	/**
	 * @enum {number}
	 */
	var Reg = {
		R0 : 0 , R1 :  1, R2 : 2 , R3 : 3,
		R4 : 4 , R5 :  5, R6 : 6 , R7 : 7,
		R8 : 8 , R9 :  9, R10: 10, R11: 11,
		R12: 12, R13: 13, R14: 14, R15: 15,
		LR: 14, PC: 15,
		CPSR: 16, SPSR: 17
	};

	CPU.Reg = Reg;

	/**
	 * @enum {number}
	 */
	var Status = {
		N: 1 << 31,
		Z: 1 << 30,
		C: 1 << 29,
		V: 1 << 28,
		ALL: 0x0F << 28
	};

	CPU.Status = Status;

	/**
	 * @enum {number}
	 */
	var Control = {
		M: 1 << 0,
		A: 1 << 1,
		P: 1 << 4,
		D: 1 << 5,
		L: 1 << 6,
		S: 1 << 8,
		V: 1 << 13
	};

	(function () {
		var all = 0;
		for (var x in Control)
			if (Control.hasOwnProperty (x))
				all |= Control[x];
		Control.ALL = all;
	})();

	CPU.Control = Control;

	// register utility functions
	/*
	Register.createGetter = function (bit) {
		return function () {
			return !!(this._value & (1 << bit));
		};
	};
	Register.createSetter = function (bit) {
		var shifted = 1 << bit;
		return function (state) {
			if (state)
				this._value |= shifted;
			else
				this._value &= ~shifted;
		};
	};
	*/

	/**
	 * @constructor
	 * @param {string} bank
	 * @param {number} index
	 * @param {number} value
	 */
	function Register (bank, index, value)
	{
		this.bank = bank;
		this.index = index;
		this.set (value || 0);
	}
	
	Register.prototype.get = function () { return this._value; };
	Register.prototype.set = function (value) { this._value = value >>> 0; };

	/**
	 * @constructor
	 * @param {string} bank
	 * @param {number} index
	 * @param {number} value
	 */
	function ProgramCounter (bank, index, value) { goog.base (this, bank, index, value); }
	goog.inherits (ProgramCounter, Register);
	ProgramCounter.prototype.get = function () { return this._value + 4; };

	/**
	 * @constructor
	 * @param {string} bank
	 * @param {number} index
	 * @param {number} value
	 */
	function StatusRegister (bank, index, value) { goog.base (this, bank, index, value); }
	goog.inherits (StatusRegister, Register);
	StatusRegister.prototype.getMode = function () { return this._value & 0x1F; };

	/**
	 * @constructor
	 */
	function ControlRegister () { goog.base (this, "cp", -1, 0); }
	goog.inherits (ControlRegister, Register);
	/*
	goog.mixin (ControlRegister.prototype, {
		getM: Register.createGetter (0),
		setM: Register.createSetter (0)
	});
	*/
	
	/**
	 * @constructor
	 */
	function Core (pmem)
	{
		var rb = this.regbanks = new Array (32);

		// copy general bank to all modes
		var genbank = new Array (18); // 16 GP + 2 Status
		for (var i = Reg.R0; i < Reg.PC; i++)
			genbank[i] = new Register ("all", i);
		genbank[Reg.PC] = new ProgramCounter ("all", Reg.PC);
		genbank[Reg.CPSR] = new StatusRegister ("all", Reg.CPSR, 0xd3);
		genbank[Reg.SPSR] = null;

		for (var key in Mode)
		{
			if (Mode.hasOwnProperty (key))
			{
				var mode = Mode[key];
				rb[mode] = genbank.slice (0);
			}
		}

		// create mode-specific registers
		var msmap = {
			"svc": Mode.SVC,
			"abt": Mode.ABT,
			"und": Mode.UND,
			"irq": Mode.IRQ,
			"fiq": Mode.FIQ
		};

		for (var name in msmap)
		{
			if (msmap.hasOwnProperty (name))
			{
				var num = msmap[name];
				var bank = rb[num];
				bank[Reg.R13] = new Register (name, Reg.R13);
				bank[Reg.R14] = new Register (name, Reg.R14);
				bank[Reg.SPSR] = new StatusRegister (name, Reg.SPSR);
			}
		}

		// more registers for FIQ mode
		for (var i = Reg.R8; i <= Reg.R12; i++)
			rb[Mode.FIQ][i] = new Register ("fiq", i);

		// remember commonly used registers
		this.lr = genbank[Reg.LR];
		this.pc = genbank[Reg.PC];
		this.cpsr = genbank[Reg.CPSR];

		// control register(s)
		this.creg = new ControlRegister ();

		// memory management
		this.mmu = new CPU.MMU (this, pmem);

		// instruction execution
		this.info = {
			Rn: null,
			Rd: null,
			Rs: null,
			Rm: null
		};
	}

	Core.prototype = {
		getRegBank: function () {
			return this.regbanks[this.cpsr.getMode()];
		},
		getReg: function (n) {
			return this.getRegBank()[n];
		}
	};

	CPU.Core = Core;

})();
