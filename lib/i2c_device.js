
var sys = require('sys'),
    EventEmitter = require('events').EventEmitter;

var i2cDevice = function(bus, address, options) {
  this.bus = bus;
  this.address = address;
  EventEmitter.call(this);
};

sys.inherits(i2cDevice, EventEmitter);

module.exports = i2cDevice;

i2cDevice.prototype.write8 = function(reg, value, cb) {
  var _self = this;
  _self.bus.WriteByteData(_self.address, reg, value, cb);
};
i2cDevice.prototype._write = function(bytes, cb) {
  var _self = this;
  _self.bus.read(_self.address, bytes, cb);
};
/**
 * Read unsigned byte from <reg>
 **/
i2cDevice.prototype.readU8 = function(reg, cb) {
  var _self = this;
  _self.bus.ReadByteData(_self.address, reg, cb);
};

i2cDevice.prototype._readBytes = function(reg, len, cb) {
  var _self = this;
  var result = [];
  _self.bus.ReadByteData(_self.address, reg, function(er, data){
    if (er){cb(er); return;}
    result.push(data);
    _self.bus.read(_self.address, (len-1), function(er, data){
      if (er) {cb(er); return;}
      cb(null, result.concat(data));
    });
  });
};

i2cDevice.prototype._read = function(len, cb) {
  var _self = this;
  _self.bus.read(_self.address, len, cb);
};
