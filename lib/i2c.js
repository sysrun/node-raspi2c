var EventEmitter = require('events').EventEmitter,
    sys = require('sys'),
    wire = require('../build/Release/i2c'),
    _ = require('underscore');



function i2c(device, options) {
  var _this = this;
  this.options = options != null ? options : {};
  _.defaults(this.options, {
    debug: false
  });
  wire.open(device, function(err) {
    if (err) {
      throw err;
    }
  });
  if (this.options.debug) {
    require('repl').start({
      prompt: "i2c > "
    }).context.wire = this;
    process.stdin.emit('data', 1);
  }
  process.on('exit', function() {
    return _this.close();
  });
}

sys.inherits(i2c, EventEmitter);

i2c.prototype.write = function(addr, bytes, callback) {
  return wire.write(addr, bytes, callback);
};

i2c.prototype.WriteByteData = function(addr, command, bytedata, callback) {
  return wire.WriteByteData(addr, command, bytedata, callback);
};

i2c.prototype.scan = function(callback) {
  return wire.scan(function(err, data) {
    return callback(err, _.filter(data, function(num) {
      return num >= 0;
    }));
  });
};

i2c.prototype.read = function(addr, len, callback) {
  return wire.read(addr, len, callback);
};

i2c.prototype.ReadByteData = function(addr, register, callback) {
  return wire.ReadByteData(addr, register, callback);
};

i2c.prototype.close = function() {
  return wire.close();
};

i2c.prototype.stream = function(addr, cmd, len, delay) {
  var _this = this;
  if (len == null) {
    len = 1;
  }
  if (delay == null) {
    delay = 100;
  }
  wire.stream(addr, cmd, len, delay, function(err, data) {
    if (err) {
      return _this.emit('error', err);
    } else {
      return _this.emit('data', {
        data: data,
        address: addr,
        timestamp: Date.now()
      });
    }
  });
  return this;
};

module.exports = i2c;
