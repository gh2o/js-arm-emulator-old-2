(function(){function e(a, c) {
  function b() {
  }
  b.prototype = c.prototype;
  a.Z = c.prototype;
  a.prototype = new b
}
;var f;
f = function(a) {
  for(a = a.toString(16);8 > a.length;) {
    a = "0" + a
  }
  return a
};
function h(a, c) {
  this.h = Array(65536);
  this.start = a;
  this.size = c
}
h.prototype = {b:function(a) {
  if(0 != (a & 3)) {
    throw"unaligned RAM read";
  }
  var c = this.h[a >>> 16];
  return c ? c[(a & 65535) >> 2] : 0
}, e:function(a, c) {
  if(0 != (a & 3)) {
    throw"unaligned RAM write";
  }
  var b = this.h[a >>> 16];
  b || (b = new Uint32Array(16384), this.h[a >>> 16] = b);
  b[(a & 65535) >> 2] = c
}};
function k() {
  this.l = []
}
k.prototype = {v:function(a) {
  this.l.push(a)
}, m:function(a) {
  for(var c = this.l, b = 0;b < c.length;b++) {
    var d = c[b], g = d.start, j = d.size;
    if(a >= g && a < g + j) {
      return d
    }
  }
  throw"undefined access to physical location " + f(a);
}, b:function(a) {
  if(0 != (a & 3)) {
    throw"unaligned physical read";
  }
  var c = this.m(a);
  return c.b(a - c.start)
}, e:function(a, c) {
  if(0 != (a & 3)) {
    throw"unaligned physical write";
  }
  var b = this.m(a);
  b.e(a - b.start, c)
}};
function l(a, c) {
  this.w = a;
  this.F = c
}
l.prototype = {b:function(a) {
  if(this.w.B.C()) {
    throw"translated mmu read not implemented";
  }
  if(0 != (a & 3)) {
    throw"unaligned mmu read not implemented";
  }
  return this.F.b(a)
}, e:function() {
  throw"mmu write not implemented";
}};
function m(a, c, b) {
  this.U = a;
  this.index = c;
  this.set(b || 0)
}
function n(a, c, b) {
  m.call(this, a, c, b)
}
function p(a, c, b) {
  m.call(this, a, c, b)
}
function q() {
  m.call(this, "cp", -1, 0)
}
function r(a) {
  for(var c = this.X = Array(32), b = Array(18), d = s.q;d < s.c;d++) {
    b[d] = new m("all", d)
  }
  b[s.c] = new n("all", s.c);
  b[s.f] = new p("all", s.f, 467);
  b[s.g] = null;
  for(var g in t) {
    t.hasOwnProperty(g) && (c[t[g]] = b.slice(0))
  }
  var d = {svc:t.t, abt:t.n, und:t.u, irq:t.o, fiq:t.i}, j;
  for(j in d) {
    d.hasOwnProperty(j) && (g = c[d[j]], g[s.j] = new m(j, s.j), g[s.k] = new m(j, s.k), g[s.g] = new p(j, s.g))
  }
  for(d = s.s;d <= s.r;d++) {
    c[t.i][d] = new m("fiq", d)
  }
  this.W = b[s.p];
  this.d = b[s.c];
  this.V = b[s.f];
  this.B = new q;
  this.D = new l(this, a)
}
var t = {T:16, i:17, o:18, t:19, n:23, u:27, S:31}, s = {q:0, H:1, L:2, M:3, N:4, O:5, P:6, Q:7, s:8, R:9, I:10, J:11, r:12, j:13, k:14, K:15, p:14, c:15, f:16, g:17};
m.z = function() {
  return function() {
    return!!(this.a & 1)
  }
};
m.A = function() {
  return function(a) {
    this.a = a ? this.a | 1 : this.a & -2
  }
};
m.prototype = {set:function(a) {
  this.a = a >>> 0
}};
e(n, m);
e(p, m);
e(q, m);
var u = q.prototype, v = {C:m.z(), Y:m.A()}, w;
for(w in v) {
  u[w] = v[w]
}
r.prototype = {G:function() {
  var a = this.D.b(this.d.a);
  this.d.a += 4;
  console.log(f(a));
  throw"haha";
}};
function x(a) {
  r.call(this, a)
}
e(x, r);
function y(a, c, b) {
  for(var d = 0;d < b.length;d += 4) {
    a.e(c + d, b.readUInt32LE(d, !0))
  }
}
var z = new k;
z.v(new h(0, 134217728));
var A = require("fs");
y(z, 16777216, A.readFileSync("./kernel/image"));
y(z, 33554432, A.readFileSync("./kernel/board.dtb"));
var B = new x(z);
for(B.d.set(16777216);;) {
  B.G()
}
;})()
