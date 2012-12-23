(function(){function k(a) {
  throw a;
}
var m = !0, p = !1;
function q(a) {
  var b = r;
  function c() {
  }
  c.prototype = b.prototype;
  a.oa = b.prototype;
  a.prototype = new c
}
;var t, u, v, w, x, y, z, A, B;
t = function(a) {
  for(a = a.toString(16);8 > a.length;) {
    a = "0" + a
  }
  return a
};
u = function(a, b) {
  return(a >>> b | a << 32 - b) >>> 0
};
function C(a, b) {
  this.v = Array(65536);
  this.start = a;
  this.size = b
}
C.prototype = {f:function(a) {
  0 != (a & 3) && k("unaligned RAM read");
  var b = this.v[a >>> 16];
  return b ? b[(a & 65535) >> 2] : 0
}, j:function(a, b) {
  0 != (a & 3) && k("unaligned RAM write");
  var c = this.v[a >>> 16];
  c || (c = new Uint32Array(16384), this.v[a >>> 16] = c);
  c[(a & 65535) >> 2] = b
}};
v = C;
function D() {
  this.I = []
}
D.prototype = {U:function(a) {
  this.I.push(a)
}, J:function(a) {
  for(var b = this.I, c = 0;c < b.length;c++) {
    var e = b[c], d = e.start, f = e.size;
    if(a >= d && a < d + f) {
      return e
    }
  }
  k("undefined access to physical location " + t(a))
}, f:function(a) {
  0 != (a & 3) && k("unaligned physical read");
  var b = this.J(a);
  return b.f(a - b.start)
}, j:function(a, b) {
  0 != (a & 3) && k("unaligned physical write");
  var c = this.J(a);
  c.j(a - c.start, b)
}};
w = D;
function E(a, b) {
  this.H = a;
  this.L = b
}
E.prototype = {f:function(a) {
  this.H.w.a & x.r && k("translated mmu read not implemented");
  0 != (a & 3) && k("unaligned mmu read not implemented");
  return this.L.f(a)
}, j:function(a, b) {
  this.H.w.a & x.r && k("translated mmu write not implemented");
  0 != (a & 3) && k("unaligned mmu write not implemented");
  this.L.j(a, b)
}};
function r(a, b, c) {
  this.ka = a;
  this.index = b;
  this.set(c || 0)
}
function F(a, b, c) {
  r.call(this, a, b, c)
}
function G(a, b, c) {
  r.call(this, a, b, c)
}
function H() {
  r.call(this, "cp", -1, 0)
}
function I(a) {
  for(var b = this.X = Array(32), c = Array(18), e = J.O;e < J.l;e++) {
    c[e] = new r("all", e)
  }
  c[J.l] = new F("all", J.l);
  c[J.q] = new G("all", J.q, 211);
  c[J.i] = null;
  for(var d in K) {
    K.hasOwnProperty(d) && (b[K[d]] = c.slice(0))
  }
  var e = {svc:K.R, abt:K.M, und:K.S, irq:K.N, fiq:K.B}, f;
  for(f in e) {
    e.hasOwnProperty(f) && (d = b[e[f]], d[J.D] = new r(f, J.D), d[J.F] = new r(f, J.F), d[J.i] = new G(f, J.i))
  }
  for(e = J.Q;e <= J.P;e++) {
    b[K.B][e] = new r("fiq", e)
  }
  this.la = c[J.C];
  this.d = c[J.l];
  this.c = c[J.q];
  this.w = new H;
  this.o = new E(this, a);
  this.info = {e:null, g:null, G:null, h:null}
}
var K = {T:16, B:17, N:18, R:19, M:23, S:27, ja:31};
y = K;
var J = {O:0, Z:1, ca:2, da:3, ea:4, fa:5, ga:6, ha:7, Q:8, ia:9, $:10, aa:11, P:12, D:13, F:14, ba:15, C:14, l:15, q:16, i:17};
z = J;
A = {s:-2147483648, u:1073741824, k:536870912, t:268435456, A:-268435456};
var L = {r:1};
L.A = L.r;
x = L;
r.prototype.get = function() {
  return this.a
};
r.prototype.set = function(a) {
  this.a = a >>> 0
};
q(F);
F.prototype.get = function() {
  return this.a + 4
};
q(G);
G.prototype.K = function() {
  return this.a & 31
};
q(H);
I.prototype = {z:function() {
  return this.X[this.c.K()]
}, p:function(a) {
  return this.z()[a]
}};
B = I;
var M = B, N = M.V = [];
M.b = function(a, b, c, e) {
  if("object" === typeof b) {
    if(b.m && b.n) {
      for(var d = b.m;d <= b.n;d++) {
        M.b(a, d, c, e)
      }
    }else {
      for(d = 0;d < b.length;d++) {
        M.b(a, b[d], c, e)
      }
    }
  }else {
    if("object" === typeof c) {
      if(c.m && c.n) {
        for(d = c.m;d <= c.n;d++) {
          M.b(a, b, d, e)
        }
      }else {
        for(d = 0;d < c.length;d++) {
          M.b(a, b, c[d], e)
        }
      }
    }else {
      if(0 > c) {
        for(d = 0;16 > d;d++) {
          M.b(a, b, d, e)
        }
      }else {
        e = Boolean(e), b = e << 12 | b << 4 | c, N[b] && N[b] !== a && k("reregistration of instruction!"), N[b] = a
      }
    }
  }
};
var O = B;
O.b(function(a) {
  this.d.set(this.d.get() + (a << 8 >> 6))
}, {m:160, n:175}, -1, p);
O.b(function(a) {
  a = a << 8 >> 6;
  this.p(z.C).set(this.d.a);
  this.d.set(this.d.get() + a)
}, {m:176, n:191}, -1, p);
var P = B, Q = [];
Q[15] = {W:function(a, b, c, e, d) {
  if(0 == b) {
    if(0 == d) {
      return 1090949728
    }
  }else {
    if(1 == b && 0 == d) {
      return a.w.a
    }
  }
  k("bad CP15 read")
}, write:function(a, b, c, e, d, f) {
  if(1 != b) {
    if(2 == b) {
      a.o.na = f;
      return
    }
    if(3 == b) {
      a.o.ma = f;
      return
    }
    if(7 == b) {
      if(7 == c && 0 == d || 10 == c && 4 == d) {
        return
      }
    }else {
      if(8 == b && 7 == c && 0 == d) {
        return
      }
    }
  }
  k("bad CP15 write: n=" + b + ", m=" + c + ", o1=" + e + ", o2=" + d)
}};
P.b(function(a, b) {
  var c = b.e.index, e = b.h.index, d = Q[a >>> 8 & 15];
  d || k("bad coprocessor number");
  b.g.set(d.W(this, c, e, a >>> 21 & 7, a >>> 5 & 7))
}, [225, 227, 229, 231, 233, 235, 237, 239], [1, 3, 5, 7, 9, 11, 13, 15], p);
P.b(function(a, b) {
  var c = b.e.index, e = b.h.index, d = Q[a >>> 8 & 15];
  d || k("bad coprocessor number");
  d.write(this, c, e, a >>> 21 & 7, a >>> 5 & 7, b.g.get())
}, [224, 226, 228, 230, 232, 234, 236, 238], [1, 3, 5, 7, 9, 11, 13, 15], p);
function R(a, b) {
  S.b(a, [b | 32, b | 33], -1, p);
  S.b(a, [b, b | 1], [0, 2, 4, 6, 8, 10, 12, 14, 1, 3, 5, 7], p)
}
function T(a, b, c, e, d, f) {
  var g = !!(a.c.a & A.k), h = 0, j = p;
  if(b & 33554432) {
    g = b >>> 8 & 15, h = u(b & 255, 2 * g), 0 != g && (j = h & -2147483648)
  }else {
    var Y = b >>> 5 & 3, l;
    b & 16 ? l = c.G.get() & 255 : (l = b >>> 7 & 31, l = 0 != l ? l : [0, 32, 32, -1][Y]);
    var n = c.h.get();
    switch(Y) {
      case 0:
        0 == l ? (h = n, j = g) : 32 > l ? (h = n << l, j = n & 1 << 32 - l) : 32 == s && (h = 0, j = n & 1);
        break;
      case 1:
        0 == l ? (h = n, j = g) : 32 > l ? (h = n >>> l, j = n & 1 << l - 1) : 32 == l && (h = 0, j = n & -2147483648);
        break;
      case 2:
        0 == l ? (h = n, j = g) : 32 > l ? (h = n >> l, j = n & 1 << l - 1) : h = (j = n & -2147483648) ? -1 : 0;
        break;
      case 3:
        j = l & 31, -1 == l ? (h = g << 31 | n >>> 1, j = n & 1) : 0 == l ? (h = n, j = g) : 0 == j ? (h = n, j = n & -2147483648) : (h = u(n, j), j = n & 1 << j - 1)
    }
  }
  h >>>= 0;
  j = !!j;
  g = c.e.get() >>> 0;
  h >>>= 0;
  d = d(g, h) >>> 0;
  e && c.g.set(d);
  e && b & 1048576 && 15 == c.g.index ? (f = a.p(z.i), a.p(z.i) ? a.c.a = f.a : k("attempted to set CPSR to SPSR when no SPSR exists")) : b & 1048576 && (b = a.c.a >>> 0, a.c.a = (b & ~A.A | f(g, h, d, j, b)) >>> 0)
}
function U(a, b, c, e, d) {
  return(c & -2147483648 ? A.s : 0) | (0 == c ? A.u : 0) | (e ? A.k : 0) | d & A.t
}
function aa(a, b, c) {
  a = !!(a & -2147483648);
  b = !!(b & -2147483648);
  var e = !!(c & -2147483648);
  return(c & -2147483648 ? A.s : 0) | (0 == c ? A.u : 0) | ((a || !b) && (!b || !e) && (!e || a) ? A.k : 0) | (a != b && a != e ? A.t : 0)
}
var S = B;
R(function(a, b) {
  T(this, a, b, m, function(c, a) {
    return c & a
  }, U)
}, 0);
R(function(a, b) {
  T(this, a, b, m, function(a, b) {
    return a - b
  })
}, 4);
R(function(a, b) {
  T(this, a, b, m, function(a, b) {
    return a + b
  })
}, 8);
R(function(a, b) {
  T(this, a, b, p, function(a, b) {
    return a & b
  }, U)
}, 17);
R(function(a, b) {
  T(this, a, b, p, function(a, b) {
    return a ^ b
  }, U)
}, 19);
R(function(a, b) {
  T(this, a, b, p, function(a, b) {
    return a - b
  }, aa)
}, 21);
R(function(a, b) {
  T(this, a, b, m, function(a, b) {
    return a | b
  }, U)
}, 24);
R(function(a, b) {
  T(this, a, b, m, function(a, b) {
    return b
  }, U)
}, 26);
R(function(a, b) {
  T(this, a, b, m, function(a, b) {
    return a & ~b
  }, U)
}, 28);
B.b(function(a, b) {
  var c = a & 65535, c = c - (c >>> 1 & 21845), c = (c >>> 2 & 13107) + (c & 13107), c = (c >>> 4) + c & 3855, c = ((c >>> 8) + c & 255) << 2, e, d, f = b.e, g = f.get(), h = a >>> 23 & 3;
  switch(h) {
    case 0:
      e = g - c + 4;
      d = g;
      break;
    case 1:
      e = g;
      d = g + c - 4;
      break;
    case 2:
      e = g - c;
      d = g - 4;
      break;
    case 3:
      e = g + 4, d = g + c
  }
  e >>>= 0;
  d >>>= 0;
  a & 2097152 && (h & 1 ? f.set(g + c) : f.set(g - c));
  c = a & 65535;
  f = this.z();
  g = this.o;
  for(h = 0;14 >= h;h++) {
    c & 1 << h && (f[h].set(g.f(e)), e += 4)
  }
  c & 32768 && (f[z.l].set(g.f(e) & -4), e += 4);
  d != e - 4 && k("LDM(1) memory assertion error")
}, [129, 131, 137, 139, 145, 147, 153, 155], -1, p);
function V(a, b) {
  for(var c = (b ? 1 : 0) | 64, c = [c, c | 16, c | 18], e = c.length, d = 0;d < e;d++) {
    c.push(c[d] | 8)
  }
  W.b(a, c, -1, p);
  for(d = 0;d < c.length;d++) {
    c[d] |= 32
  }
  W.b(a, c, [0, 2, 4, 6, 8, 10, 12, 14], p)
}
function ba(a, b, c, e) {
  var d;
  if(b & 33554432) {
    var f = c.h.get(), g = b >>> 7 & 31;
    switch(b >>> 5 & 3) {
      case 0:
        d = f << g;
        break;
      case 1:
        d = 0 == g ? 0 : f >>> g;
        break;
      case 2:
        d = 0 == g ? f & -2147483648 ? -1 : 0 : f >> g;
        break;
      case 3:
        d = 0 == g ? !!(a.c.a & A.k) << 31 | f >>> 1 : u(f, g)
    }
  }else {
    d = b & 4095
  }
  b & 8388608 || (d = -d);
  f = !!(b & 2097152);
  b & 16777216 ? (b = c.e.get() + d >>> 0, f && c.e.set(b)) : (b = c.e.get() >>> 0, c.e.set(b + d));
  e(b, c.g, a.o)
}
var W = B;
V(function(a, b) {
  ba(this, a, b, function(a, b, d) {
    d = d.f(a);
    d = u(d, 8 * (a & 3));
    15 == b.index ? b.set(d & -4) : b.set(d)
  })
}, m);
V(function(a, b) {
  ba(this, a, b, function(a, b, d) {
    d.j(a & -4, b.get())
  })
}, p);
function ca(a, b) {
  var c;
  c = a & 33554432 ? u(a & 255, 2 * (a >>> 8 & 15)) : b.h.get();
  c & 268435200 && k("attempted to set reserved PSR bits");
  var e = (a & 16 ? 255 : 0) | (a & 17 ? 65280 : 0) | (a & 18 ? 16711680 : 0) | (a & 19 ? 4278190080 : 0);
  if(a & 4194304) {
    var d = this.p(z.i);
    d || k("attempted to read non-existent SPSR");
    e &= -268435409;
    d.a = d.a & ~e | c & e
  }else {
    this.c.K() != y.T ? (c & 32 && k("attempted to set non-ARM state"), e &= -268435441) : e &= 4026531840, this.c.a = this.c.a & ~e | c & e
  }
}
var X = B;
X.b(function(a, b) {
  b.g.set(this.c.get())
}, 16, 0, p);
X.b(ca, [50, 54], -1, p);
X.b(ca, [18, 22], 0, p);
function da(a, b) {
  var c = b.a, e = !!(c & A.s), d = !!(c & A.u), f = !!(c & A.k), c = !!(c & A.t);
  switch(a) {
    case 0:
      return d;
    case 1:
      return!d;
    case 2:
      return f;
    case 3:
      return!f;
    case 4:
      return e;
    case 5:
      return!e;
    case 6:
      return c;
    case 7:
      return!c;
    case 8:
      return f && !d;
    case 9:
      return!f || d;
    case 10:
      return e == c;
    case 11:
      return e != c;
    case 12:
      return!d && e == c;
    case 13:
      return d || e != c;
    case 14:
      return m;
    case 15:
      return m;
    default:
      k("unhandled condition")
  }
}
var ea = B, fa = ea.V;
ea.prototype.Y = function() {
  var a = this.o.f(this.d.a);
  this.d.a += 4;
  var b = a >>> 28;
  if(!(14 > b) || da(b, this.c)) {
    var c = (15 == b) << 12 | a >>> 16 & 4080 | a >>> 4 & 15, e = fa[c];
    if(!e) {
      var d = c >>> 4 & 255, c = c & 15, b = 15 == b, f = "undefined instruction at 0x" + t(this.d.a - 4) + ": " + t(a);
      console.log(f);
      console.log("ident1 = 0x" + d.toString(16));
      console.log("ident2 = 0x" + c.toString(16));
      console.log("unconditional = " + b);
      k(f)
    }
    d = this.z();
    c = this.info;
    c.e = d[a >>> 16 & 15];
    c.g = d[a >>> 12 & 15];
    c.G = d[a >>> 8 & 15];
    c.h = d[a & 15];
    e.call(this, a, c)
  }
};
var Z = ["image", "board.dtb"], $ = {};
Z.forEach(ga);
function ga(a) {
  var b = new XMLHttpRequest;
  b.onreadystatechange = function() {
    if(4 == b.readyState) {
      if(b.response) {
        $[a] = b.response;
        a: {
          for(var c = function(a, b) {
            for(var c = pmem, e = new DataView(b), j = 0;j < b.byteLength;j += 4) {
              c.j(a + j, e.getUint32(j, m))
            }
          }, e = 0;e < Z.length;e++) {
            if(!$[Z[e]]) {
              break a
            }
          }
          pmem = new w;
          pmem.U(new v(0, 134217728));
          c(16777216, $.image);
          c(33554432, $["board.dtb"]);
          c = new B(pmem);
          for(c.d.set(16777216);;) {
            c.Y()
          }
        }
      }else {
        ga(a)
      }
    }
  };
  b.open("GET", "resources/" + a);
  b.responseType = "arraybuffer";
  b.send()
}
;})()
