var i2c_device = require('../i2c_device'),
    sys = require('sys'),
    step =require('step'),
    _ = require('underscore');

var MCP23017_IODIRA = 0x00,
    MCP23017_IODIRB = 0x01,
    MCP23017_GPIOA  = 0x12,
    MCP23017_GPIOB  = 0x13,
    MCP23017_GPPUA  = 0x0C, // MCP23017 Weak Pull-Ups
    MCP23017_GPPUB  = 0x0D, // MCP23017 1= Pulled HIgh via internal 100k
    MCP23017_OLATA  = 0x14,
    MCP23017_OLATB  = 0x15,
    MCP23008_IODIR  = 0x00,
    MCP23008_GPIO   = 0x09,
    MCP23008_GPPU   = 0x06,
    MCP23008_OLATA  = 0x0A;


var MCP230xx = module.exports = function(address, busnum, num_gpios) {
  i2c_device.call(this, busnum, address);
  this.address = address;
  this.num_gpios = num_gpios;
  this.portInfo = {
    'directions': 0x0000, // 16 BIT!
    'pullups': 0x0000, // 16 BIT!
    'state': 0x0000 // 16 BIT!
  };

  this.OUTPUT = 0;
  this.INPUT = 1;

  this._changebit = function(bitmap, bit, value) {
    if (value === true) {
      value = 1;
    } else if(value === false) {
      value = 0;
    }
    if (value !== 0 && value !== 1) {
      console.log(value);
      throw new Error('value NaN or not 0-1');
    }
    if (value === 0) {
      return bitmap & ~(1 << bit);
    } else {
      return bitmap | (1 << bit);
    }
  }.bind(this);
};

sys.inherits(MCP230xx, i2c_device);

MCP230xx.prototype.init = function(cb) {
  var _self = this;

  var pins = [0,1,2,3,4,5,6,7]; // MCP23008
  if (_self.num_gpios > 8 && _self.num_gpios <= 16) {
    pins = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
  } else if (_self.num_gpios > 16) {
    throw new Error('Maximum 16 ports (MCP23017)');
  }

  step(
    function setDirection() {
      _self.config([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], _self.INPUT, this);
    },
    function setPullups() {
      _self.pullup([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], false, this);
    },
    function done() {
      console.log('init done');
      cb();
    }
  );
};

MCP230xx.prototype.pullup = function(pins, state, cb) {
  var _self = this;

  if (!_.isArray(pins)) { pins = [pins]; }

  pins.forEach(function(pin){
    if (pin >=0 && pin < 16) {
      _self.portInfo.pullups = _self._changebit(_self.portInfo.pullups, pin, state);
    } else {
      throw new Error('pin '+pin+' out of range');
    }
  });
  if (_.isFunction(cb)) {
    if (_self.num_gpios <= 8) {
      return _self._updateRegister(MCP23008_GPPU, null, _self.portInfo.pullups, cb);
    } else {
      return _self._updateRegister(MCP23017_GPPUA, MCP23017_GPPUB, _self.portInfo.pullups, cb);
    }
  } else {
    return _self;
  }
};

MCP230xx.prototype.output = function(pins, value, cb) {
  var _self = this;

  if (!_.isArray(pins)) { pins = [pins]; }

  pins.forEach(function(pin){
    if (pin >=0 && pin < _self.num_gpios) {
      _self.portInfo.state = _self._changebit(_self.portInfo.state, pin, value);
    } else {
      throw new Error('pin '+pin+' out of range');
    }
  });

  if (_.isFunction(cb)) {
    if (_self.num_gpios <= 8) {
      return _self._updateRegister(MCP23008_GPIO, null, _self.portInfo.state, cb);
    } else {
      return _self._updateRegister(MCP23017_GPIOA, MCP23017_GPIOB, _self.portInfo.state, cb);
    }
  } else {
    return _self;
  }
};


MCP230xx.prototype.setIn = function(pins, cb) {
  var _self = this;
  return _self._setDirection(pins, _self.INPUT, cb);
};

MCP230xx.prototype.setOut = function(pins, cb) {
  var _self = this;
  return _self._setDirection(pins, _self.OUTPUT, cb);
};

MCP230xx.prototype.config = function(pins, value, cb) {
  var _self = this;
  return _self._setDirection(pins, value, cb);
};


MCP230xx.prototype._setDirection = function(pins, dir, cb) {
  var _self = this;

  if (!_.isArray(pins)) { pins = [pins]; }

  pins.forEach(function(pin){
    if (pin >=0 && pin < _self.num_gpios) {
      _self.portInfo.directions = _self._changebit(_self.portInfo.directions, pin, dir);
    } else {
      throw new Error('pin '+pin+' out of range');
    }
  });
  if (_.isFunction(cb)) {
    if (_self.num_gpios <= 8) {
      return _self._updateRegister(MCP23008_IODIR, null, _self.portInfo.directions, cb);
    } else {
      return _self._updateRegister(MCP23017_IODIRA, MCP23017_IODIRB, _self.portInfo.directions, cb);
    }
  } else {
    return _self;
  }
};

MCP230xx.prototype._updateRegister = function(registerA, registerB, value, cb) {
  var _self = this;

  step(
    function updateRegisterA() {
      var lower = value & 0xFF;
      _self._write8(registerA, lower, this);
    },

    function updateRegisterB() {
      if(registerB) {
        var upper = value >> 8;
        _self._write8(registerB, upper, this);
      } else {
        this();
      }
    },

    function done() {
      if (cb) {
        cb();
      }
      return;
    }
  );
};
