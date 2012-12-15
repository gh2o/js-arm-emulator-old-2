function a() {
  this.a = Array(65536)
}
a.prototype = {};
new a;

