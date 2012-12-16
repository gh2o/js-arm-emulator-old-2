(function(){function e(a, c) {
  function b() {
  }
  b.prototype = c.prototype;
  a.F = c.prototype;
  a.prototype = new b
}
;var g, j;
g = function(a) {
  for(a = a.toString(16);8 > a.length;) {
    a = "0" + a
  }
  return a
};
function k(a, c) {
  this.e = Array(65536);
  this.start = a;
  this.size = c
}
k.prototype = {b:function(a) {
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
function l() {
  this.g = []
}
l.prototype = {m:function(a) {
  this.g.push(a)
}, h:function(a) {
  for(var c = this.g, b = 0;b < c.length;b++) {
    var d = c[b], f = d.start, h = d.size;
    if(a >= f && a < f + h) {
      return d
    }
  }
  throw"undefined access to physical location " + g(a);
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
function m(a, c) {
  this.n = a;
  this.t = c
}
m.prototype = {b:function(a) {
  if(this.n.q.r()) {
    throw"translated mmu read not implemented";
  }
  if(0 != (a & 3)) {
    throw"unaligned mmu read not implemented";
  }
  return this.t.b(a)
}, d:function() {
  throw"mmu write not implemented";
}};
function n(a, c, b) {
  this.z = a;
  this.index = c;
  this.set(b || 0)
}
function p(a, c, b) {
  n.call(this, a, c, b)
}
function q(a, c, b) {
  n.call(this, a, c, b)
}
function r() {
  n.call(this, "cp", -1, 0)
}
var s = {w:16, f:17, j:18, k:19, i:23, l:27, v:31};
n.o = function() {
  return function() {
    return!!(this.a & 1)
  }
};
n.p = function() {
  return function(a) {
    this.a = a ? this.a | 1 : this.a & -2
  }
};
n.prototype = {set:function(a) {
  this.a = a >>> 0
}};
e(p, n);
e(q, n);
e(r, n);
var t = r.prototype, u = {r:n.o(), D:n.p()}, v;
for(v in u) {
  t[v] = u[v]
}
j = function(a) {
  for(var c = this.C = Array(32), b = Array(18), d = 0;15 > d;d++) {
    b[d] = new n("all", d)
  }
  b[15] = new p("all", 15);
  b[16] = new q("all", 16, 467);
  b[17] = null;
  for(var f in s) {
    s.hasOwnProperty(f) && (c[s[f]] = b.slice(0))
  }
  var d = {svc:s.k, abt:s.i, und:s.l, irq:s.j, fiq:s.f}, h;
  for(h in d) {
    d.hasOwnProperty(h) && (f = c[d[h]], f[13] = new n(h, 13), f[14] = new n(h, 14), f[17] = new q(h, 17))
  }
  for(d = 8;12 >= d;d++) {
    c[s.f][d] = new n("fiq", d)
  }
  this.B = b[14];
  this.c = b[15];
  this.A = b[16];
  this.q = new r;
  this.s = new m(this, a)
};
function w(a) {
  j.call(this, a)
}
e(w, j);
w.prototype.u = function() {
  var a = this.s.b(this.c.a);
  this.c.a += 4;
  console.log(g(a));
  throw"haha";
};
function x(a, c, b) {
  for(var d = 0;d < b.length;d += 4) {
    a.d(c + d, b.readUInt32LE(d, !0))
  }
}
var y = new l;
y.m(new k(0, 134217728));
var z = require("fs");
x(y, 16777216, z.readFileSync("./kernel/image"));
x(y, 33554432, z.readFileSync("./kernel/board.dtb"));
var A = new w(y);
for(A.c.set(16777216);;) {
  A.u()
}
;})()
