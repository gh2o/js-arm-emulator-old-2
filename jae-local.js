(function(){function f(a) {
  var c = h;
  function b() {
  }
  b.prototype = c.prototype;
  a.F = c.prototype;
  a.prototype = new b
}
;var j, k;
j = function(a) {
  for(a = a.toString(16);8 > a.length;) {
    a = "0" + a
  }
  return a
};
function l(a, c) {
  this.e = Array(65536);
  this.start = a;
  this.size = c
}
l.prototype = {b:function(a) {
  if(0 != (a & 3)) {
    throw"unaligned RAM read";
  }
  var c = this.e[a >>> 16];
  return c ? c[(a & 65535) >> 2] : 0
}, d:function(a, c) {
  if(0 != (a & 3)) {
    throw"unaligned RAM write";
  }
  var b = this.e[a >>> 16];
  b || (b = new Uint32Array(16384), this.e[a >>> 16] = b);
  b[(a & 65535) >> 2] = c
}};
function m() {
  this.g = []
}
m.prototype = {m:function(a) {
  this.g.push(a)
}, h:function(a) {
  for(var c = this.g, b = 0;b < c.length;b++) {
    var d = c[b], e = d.start, g = d.size;
    if(a >= e && a < e + g) {
      return d
    }
  }
  throw"undefined access to physical location " + j(a);
}, b:function(a) {
  if(0 != (a & 3)) {
    throw"unaligned physical read";
  }
  var c = this.h(a);
  return c.b(a - c.start)
}, d:function(a, c) {
  if(0 != (a & 3)) {
    throw"unaligned physical write";
  }
  var b = this.h(a);
  b.d(a - b.start, c)
}};
function n(a, c) {
  this.o = a;
  this.u = c
}
n.prototype = {b:function(a) {
  if(this.o.r.s()) {
    throw"translated mmu read not implemented";
  }
  if(0 != (a & 3)) {
    throw"unaligned mmu read not implemented";
  }
  return this.u.b(a)
}, d:function() {
  throw"mmu write not implemented";
}};
function h(a, c, b) {
  this.A = a;
  this.index = c;
  this.set(b || 0)
}
function p(a, c, b) {
  h.call(this, a, c, b)
}
function q(a, c, b) {
  h.call(this, a, c, b)
}
function r() {
  h.call(this, "cp", -1, 0)
}
var s = {z:16, f:17, j:18, k:19, i:23, l:27, w:31};
h.p = function() {
  return function() {
    return!!(this.a & 1)
  }
};
h.q = function() {
  return function(a) {
    this.a = a ? this.a | 1 : this.a & -2
  }
};
h.prototype = {set:function(a) {
  this.a = a >>> 0
}};
f(p);
f(q);
f(r);
var t = r.prototype, u = {s:h.p(), D:h.q()}, v;
for(v in u) {
  t[v] = u[v]
}
k = function(a) {
  for(var c = this.C = Array(32), b = Array(18), d = 0;15 > d;d++) {
    b[d] = new h("all", d)
  }
  b[15] = new p("all", 15);
  b[16] = new q("all", 16, 467);
  b[17] = null;
  for(var e in s) {
    s.hasOwnProperty(e) && (c[s[e]] = b.slice(0))
  }
  var d = {svc:s.k, abt:s.i, und:s.l, irq:s.j, fiq:s.f}, g;
  for(g in d) {
    d.hasOwnProperty(g) && (e = c[d[g]], e[13] = new h(g, 13), e[14] = new h(g, 14), e[17] = new q(g, 17))
  }
  for(d = 8;12 >= d;d++) {
    c[s.f][d] = new h("fiq", d)
  }
  this.B = b[14];
  this.c = b[15];
  this.n = b[16];
  this.r = new r;
  this.t = new n(this, a)
};
function w(a, c) {
  var b = c.a, d = !!(b & -2147483648), e = !!(b & 1073741824), g = !!(b & 536870912), b = !!(b & 268435456);
  switch(a) {
    case 0:
      return e;
    case 1:
      return!e;
    case 2:
      return g;
    case 3:
      return!g;
    case 4:
      return d;
    case 5:
      return!d;
    case 6:
      return b;
    case 7:
      return!b;
    case 8:
      return g && !e;
    case 9:
      return!g || e;
    case 10:
      return d == b;
    case 11:
      return d != b;
    case 12:
      return!e && d == b;
    case 13:
      return e || d != b;
    case 14:
      return!0;
    default:
      throw"unhandled condition";
  }
}
var x = [], y = [];
k.prototype.v = function() {
  var a = this.t.b(this.c.a);
  this.c.a += 4;
  var c = x, b = a >>> 28;
  if(15 == b) {
    c = x
  }else {
    if(c = y, !w(b, this.n)) {
      return
    }
  }
  var b = a >>> 20 & 255, d = a >>> 4 & 15, c = c[b];
  c instanceof Array && (c = c[d]);
  if(!c) {
    throw a = "undefined instruction: " + j(a), console.log(a), console.log("ident1 = 0x" + b.toString(16)), console.log("ident2 = 0x" + d.toString(16)), a;
  }
  c.call(this, a)
};
function z(a, c, b) {
  for(var d = 0;d < b.length;d += 4) {
    a.d(c + d, b.readUInt32LE(d, !0))
  }
}
var A = new m;
A.m(new l(0, 134217728));
var B = require("fs");
z(A, 16777216, B.readFileSync("./kernel/image"));
z(A, 33554432, B.readFileSync("./kernel/board.dtb"));
var C = new k(A);
for(C.c.set(16777216);;) {
  C.v()
}
;})()
