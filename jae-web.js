(function(){function f(a) {
  var c = h;
  function b() {
  }
  b.prototype = c.prototype;
  a.F = c.prototype;
  a.prototype = new b
}
;var k, l, m, n;
k = function(a) {
  for(a = a.toString(16);8 > a.length;) {
    a = "0" + a
  }
  return a
};
function p(a, c) {
  this.e = Array(65536);
  this.start = a;
  this.size = c
}
p.prototype = {b:function(a) {
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
l = p;
function q() {
  this.g = []
}
q.prototype = {m:function(a) {
  this.g.push(a)
}, h:function(a) {
  for(var c = this.g, b = 0;b < c.length;b++) {
    var d = c[b], e = d.start, g = d.size;
    if(a >= e && a < e + g) {
      return d
    }
  }
  throw"undefined access to physical location " + k(a);
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
m = q;
function r(a, c) {
  this.o = a;
  this.u = c
}
r.prototype = {b:function(a) {
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
function s(a, c, b) {
  h.call(this, a, c, b)
}
function t(a, c, b) {
  h.call(this, a, c, b)
}
function u() {
  h.call(this, "cp", -1, 0)
}
var v = {z:16, f:17, j:18, k:19, i:23, l:27, w:31};
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
f(s);
f(t);
f(u);
var w = u.prototype, x = {s:h.p(), D:h.q()}, y;
for(y in x) {
  w[y] = x[y]
}
n = function(a) {
  for(var c = this.C = Array(32), b = Array(18), d = 0;15 > d;d++) {
    b[d] = new h("all", d)
  }
  b[15] = new s("all", 15);
  b[16] = new t("all", 16, 467);
  b[17] = null;
  for(var e in v) {
    v.hasOwnProperty(e) && (c[v[e]] = b.slice(0))
  }
  var d = {svc:v.k, abt:v.i, und:v.l, irq:v.j, fiq:v.f}, g;
  for(g in d) {
    d.hasOwnProperty(g) && (e = c[d[g]], e[13] = new h(g, 13), e[14] = new h(g, 14), e[17] = new t(g, 17))
  }
  for(d = 8;12 >= d;d++) {
    c[v.f][d] = new h("fiq", d)
  }
  this.B = b[14];
  this.c = b[15];
  this.n = b[16];
  this.r = new u;
  this.t = new r(this, a)
};
function z(a, c) {
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
var A = [], B = [];
n.prototype.v = function() {
  var a = this.t.b(this.c.a);
  this.c.a += 4;
  var c = A, b = a >>> 28;
  if(15 == b) {
    c = A
  }else {
    if(c = B, !z(b, this.n)) {
      return
    }
  }
  var b = a >>> 20 & 255, d = a >>> 4 & 15, c = c[b];
  c instanceof Array && (c = c[d]);
  if(!c) {
    throw a = "undefined instruction: " + k(a), console.log(a), console.log("ident1 = 0x" + b.toString(16)), console.log("ident2 = 0x" + d.toString(16)), a;
  }
  c.call(this, a)
};
var C = ["image", "board.dtb"], D = {};
C.forEach(E);
function E(a) {
  var c = new XMLHttpRequest;
  c.responseType = "arraybuffer";
  c.onreadystatechange = function() {
    if(4 == c.readyState) {
      if(c.response) {
        D[a] = c.response;
        a: {
          for(var b = function(a, b) {
            for(var c = pmem, d = new Uint32Array(b), j = 0;j < b.byteLength;j += 4) {
              c.d(a + j, d[j / 4])
            }
          }, d = 0;d < C.length;d++) {
            if(!D[C[d]]) {
              break a
            }
          }
          pmem = new m;
          pmem.m(new l(0, 134217728));
          b(16777216, D.image);
          b(33554432, D["board.dtb"]);
          b = new n(pmem);
          for(b.c.set(16777216);;) {
            b.v()
          }
        }
      }else {
        E(a)
      }
    }
  };
  c.open("GET", a);
  c.send()
}
;})()
