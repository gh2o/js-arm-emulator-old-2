(function(){function e(a, c) {
  function b() {
  }
  b.prototype = c.prototype;
  a.N = c.prototype;
  a.prototype = new b
}
;var h, j;
h = function(a) {
  for(a = a.toString(16);8 > a.length;) {
    a = "0" + a
  }
  return a
};
function k(a, c) {
  this.g = Array(65536);
  this.start = a;
  this.size = c
}
k.prototype = {d:function(a) {
  if(0 != (a & 3)) {
    throw"unaligned RAM read";
  }
  var c = this.g[a >>> 16];
  return c ? c[(a & 65535) >> 2] : 0
}, f:function(a, c) {
  if(0 != (a & 3)) {
    throw"unaligned RAM write";
  }
  var b = this.g[a >>> 16];
  b || (b = new Uint32Array(16384), this.g[a >>> 16] = b);
  b[(a & 65535) >> 2] = c
}};
function l() {
  this.i = []
}
l.prototype = {o:function(a) {
  this.i.push(a)
}, j:function(a) {
  for(var c = this.i, b = 0;b < c.length;b++) {
    var d = c[b], f = d.start, g = d.size;
    if(a >= f && a < f + g) {
      return d
    }
  }
  throw"undefined access to physical location " + h(a);
}, d:function(a) {
  if(0 != (a & 3)) {
    throw"unaligned physical read";
  }
  var c = this.j(a);
  return c.d(a - c.start)
}, f:function(a, c) {
  if(0 != (a & 3)) {
    throw"unaligned physical write";
  }
  var b = this.j(a);
  b.f(a - b.start, c)
}};
function m(a, c) {
  this.q = a;
  this.u = c
}
m.prototype = {d:function(a) {
  if(this.q.r.s()) {
    throw"translated mmu read not implemented";
  }
  if(0 != (a & 3)) {
    throw"unaligned mmu read not implemented";
  }
  return this.u.d(a)
}, f:function() {
  throw"mmu write not implemented";
}};
function n(a, c, b) {
  this.A = a;
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
var s = {z:16, h:17, l:18, m:19, k:23, n:27, w:31};
n.b = function(a) {
  return function() {
    return!!(this.a & 1 << a)
  }
};
n.c = function(a) {
  var c = 1 << a;
  return function(a) {
    this.a = a ? this.a | c : this.a & ~c
  }
};
n.prototype = {set:function(a) {
  this.a = a >>> 0
}};
e(p, n);
e(q, n);
var t = q.prototype, u = {C:n.b(31), K:n.c(31), F:n.b(30), M:n.c(30), B:n.b(29), I:n.c(29), D:n.b(28), L:n.c(28)}, v;
for(v in u) {
  t[v] = u[v]
}
e(r, n);
var w = r.prototype, x = {s:n.b(0), J:n.c(0)}, y;
for(y in x) {
  w[y] = x[y]
}
j = function(a) {
  for(var c = this.H = Array(32), b = Array(18), d = 0;15 > d;d++) {
    b[d] = new n("all", d)
  }
  b[15] = new p("all", 15);
  b[16] = new q("all", 16, 467);
  b[17] = null;
  for(var f in s) {
    s.hasOwnProperty(f) && (c[s[f]] = b.slice(0))
  }
  var d = {svc:s.m, abt:s.k, und:s.n, irq:s.l, fiq:s.h}, g;
  for(g in d) {
    d.hasOwnProperty(g) && (f = c[d[g]], f[13] = new n(g, 13), f[14] = new n(g, 14), f[17] = new q(g, 17))
  }
  for(d = 8;12 >= d;d++) {
    c[s.h][d] = new n("fiq", d)
  }
  this.G = b[14];
  this.e = b[15];
  this.p = b[16];
  this.r = new r;
  this.t = new m(this, a)
};
function z(a, c) {
  var b = c.a, d = !!(b & -2147483648), f = !!(b & 1073741824), g = !!(b & 536870912), b = !!(b & 268435456);
  switch(a) {
    case 0:
      return f;
    case 1:
      return!f;
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
      return g && !f;
    case 9:
      return!g || f;
    case 10:
      return d == b;
    case 11:
      return d != b;
    case 12:
      return!f && d == b;
    case 13:
      return f || d != b;
    case 14:
      return!0;
    default:
      throw"unhandled condition";
  }
}
function A(a) {
  j.call(this, a)
}
var B = [], C = [];
e(A, j);
A.prototype.v = function() {
  var a = this.t.d(this.e.a);
  this.e.a += 4;
  var c = B, b = a >>> 28;
  if(15 == b) {
    c = B
  }else {
    if(c = C, !z(b, this.p)) {
      return
    }
  }
  var b = a >>> 20 & 255, d = a >>> 4 & 15, c = c[b];
  c instanceof Array && (c = c[d]);
  if(!c) {
    throw a = "undefined instruction: " + h(a), console.log(a), console.log("ident1 = 0x" + b.toString(16)), console.log("ident2 = 0x" + d.toString(16)), a;
  }
  c.call(this, a)
};
function D(a, c, b) {
  for(var d = 0;d < b.length;d += 4) {
    a.f(c + d, b.readUInt32LE(d, !0))
  }
}
var E = new l;
E.o(new k(0, 134217728));
var F = require("fs");
D(E, 16777216, F.readFileSync("./kernel/image"));
D(E, 33554432, F.readFileSync("./kernel/board.dtb"));
var G = new A(E);
for(G.e.set(16777216);;) {
  G.v()
}
;})()
