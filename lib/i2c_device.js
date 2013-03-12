
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

/**
 * Read unsigned byte from <reg>
 **/
i2cDevice.prototype.readU8 = function(reg, cb) {
  var _self = this;
  _self.bus.ReadByteData(_self.address, reg, cb);
};
