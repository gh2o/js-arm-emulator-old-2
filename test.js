(function(){function f(a) {
  var c = g;
  function b() {
  }
  b.prototype = c.prototype;
  a.p = c.prototype;
  a.prototype = new b
}
;var h;
h = function(a) {
  for(a = a.toString(16);8 > a.length;) {
    a = "0" + a
  }
  return a
};
function j(a, c) {
  this.c = Array(65536);
  this.start = a;
  this.size = c
}
j.prototype = {a:function(a, c) {
  if(0 != (a & 3)) {
    throw"unaligned RAM write";
  }
  var b = this.c[a >>> 16];
  b || (b = new Uint32Array(16384), this.c[a >>> 16] = b);
  b[(a & 65535) >> 2] = c
}};
function k() {
  this.d = []
}
k.prototype = {i:function(a) {
  this.d.push(a)
}, j:function(a) {
  for(var c = this.d, b = 0;b < c.length;b++) {
    var d = c[b], e = d.start, s = d.size;
    if(a >= e && a < e + s) {
      return d
    }
  }
  throw"undefined access to physical location " + h(a);
}, a:function(a, c) {
  if(0 != (a & 3)) {
    throw"unaligned physical write";
  }
  var b = this.j(a);
  b.a(a - b.start, c)
}};
function g(a, c, b) {
  this.n = a;
  this.index = c;
  this.set(b || 0)
}
function l(a, c, b) {
  g.call(this, a, c, b)
}
function m(a, c, b) {
  g.call(this, a, c, b)
}
var n = {l:16, b:17, f:18, g:19, e:23, h:27, k:31};
g.prototype = {set:function(a) {
  this.m = a >>> 0
}};
f(l);
f(m);
function p(a, c, b) {
  for(var d = 0;d < b.length;d += 4) {
    a.a(c + d, b.readUInt32LE(d, !0))
  }
}
var q = new k;
q.i(new j(0, 134217728));
var r = require("fs");
p(q, 16777216, r.readFileSync("./kernel/image"));
p(q, 33554432, r.readFileSync("./kernel/board.dtb"));
new function() {
  for(var a = this.o = Array(32), c = Array(18), b = 0;15 > b;b++) {
    c[b] = new g("all", b)
  }
  c[15] = new l("all", 15);
  c[16] = new m("all", 16);
  c[17] = null;
  for(var d in n) {
    n.hasOwnProperty(d) && (a[n[d]] = c.slice(0))
  }
  var c = {svc:n.g, abt:n.e, und:n.h, irq:n.f, fiq:n.b}, e;
  for(e in c) {
    c.hasOwnProperty(e) && (b = a[c[e]], b[13] = new g(e, 13), b[14] = new g(e, 14), b[17] = new m(e, 17))
  }
  for(b = 8;12 >= b;b++) {
    a[n.b][b] = new g("fiq", b)
  }
  console.log(a)
};
})()
