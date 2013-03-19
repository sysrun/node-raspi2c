var i2c_device = require('../i2c_device'),
    sys = require('sys'),
    step =require('step'),
    _ = require('underscore');


var REG_CONFA = 0x00,
    REG_CONFB = 0x01,
    REG_MODE  = 0x02,
    REG_X_MSB = 0x03,
    REG_X_LSB = 0x04,
    REG_Y_MSB = 0x05,
    REG_Y_LSB = 0x06,
    REG_Z_MSB = 0x07,
    REG_Z_LSB = 0x08,
    REG_STATE = 0x09,
    REG_IDNTA = 0x10,
    REG_IDNTB = 0x11,
    REG_IDNTC = 0x12;

var _OPTIONS = {
  avg_samples: {
    '0': 0x00,
    '2': 0x20,
    '4': 0x40,
    '8': 0x60
  },
  data_rate: {
    '0.75': 0x00,
    '1.5':  0x04,
    '3':    0x08,
    '7.5':  0x0C,
    '15':   0x10,
    '30':   0x14,
    '75':   0x18
  },
  gain: {
    '0.88': 0x00,
    '1.3':  0x20,
    '1.9':  0x40,
    '2.5':  0x60,
    '4':    0x80,
    '4.7':  0xA0,
    '5.6':  0xC0,
    '8.1':  0xE0
  }
};

var _GAIN_SCALE = {
  '0.88': 0.73,
  '1.3':  0.92, // DEFAULT
  '1.9':  1.22,
  '2.5':  1.52,
  '4':    2.27,
  '4.7':  2.56,
  '5.6':  3.03,
  '8.1':  4.35
};

var HMC5883L = module.exports = function(address, busnum) {
  i2c_device.call(this, busnum, address);

  this.address = address;
  this.raw_data = {x: 0, y: 0, z: 0};
  this.scaled_data = {x: 0, y: 0, z: 0};
  this.heading = 0;
  this.options = {};

};

sys.inherits(HMC5883L, i2c_device);

HMC5883L.prototype.init = function(options, cb) {
  var _self = this;
  if (_.isFunction(options)) {
    cb = options;
    options = {};
  }
  _self.options = _.defaults(options, {
    avg_samples: 0, // 0, 2, 4, 8
    data_rate: 15, //0.75, 1.5, 3, 7.5, 15, 30, 75 hz
    gain: '1.3'
  });

  if(_.indexOf(_.keys(_OPTIONS.avg_samples), _self.options.avg_samples.toString()) === -1) {
    cb('option "avg_samples" not in range ('+_.keys(_OPTIONS.avg_samples).join(',')+')');
  } else if(_.indexOf(_.keys(_OPTIONS.data_rate), _self.options.data_rate.toString()) === -1) {
    cb('option "data_rate" not in range ('+_.keys(_OPTIONS.data_rate).join(',')+')');
  } else if(_.indexOf(_.keys(_OPTIONS.gain), _self.options.gain.toString()) === -1) {
    cb('option "gain" not in range ('+_.keys(_OPTIONS.gain).join(',')+')');
  } else {

    step(
      function ConfigA() {
        var regA = 0x00;
        regA = regA | _OPTIONS.avg_samples[_self.options.avg_samples.toString()];
        regA = regA | _OPTIONS.data_rate[_self.options.data_rate.toString()];
        _self._write8(REG_CONFA, regA, this);
      },
      function ConfigB(er) {
        if (er) {cb(er); return;}
        var regB = 0x00;
        regB = regB | _OPTIONS.gain[_self.options.gain.toString()];
        _self._write8(REG_CONFB, regB, this);
      },
      function(er) {
        cb(er);
      }
    );
  }
};

HMC5883L.prototype.read = function() {
  var _self = this;

  var data = _self.bus.readblockdata(_self.address, REG_X_MSB, 6);

  _self.raw_data = {
    x: ((data[0]<<8) | data[1]),
    y: ((data[4]<<8) | data[5]),
    z: ((data[2]<<8) | data[3])
  };

  Object.keys(_self.raw_data).forEach(function( key ) {
    var val = _self.raw_data[ key ];
    _self.raw_data[ key ] = val >> 15 ? ( (val ^ 0xFFFF) + 1 ) * -1 : val;
  });

  var gainScale = getGainScale(_self.options.gain);

  _self.scaled_data = {
    x: _self.raw_data.x * gainScale,
    y: _self.raw_data.y * gainScale,
    z: _self.raw_data.z * gainScale
  };

  var heading = Math.atan2(_self.raw_data.y, _self.raw_data.x);
  if ( heading < 0 ) {
    heading += 2 * Math.PI;
  }

  if ( heading > 2 * Math.PI ) {
    heading -= 2 * Math.PI;
  }
  _self.heading = heading * (180 / Math.PI);
  return;
};

function getGainScale(gain) {
  if (_.indexOf(_GAIN_SCALE, gain.toString())) {
    return _GAIN_SCALE[gain.toString()];
  }
  return 0;
}
