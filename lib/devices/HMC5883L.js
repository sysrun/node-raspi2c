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
  }
};

var HMC5883L = module.exports = function(address, busnum, options) {
  i2c_device.call(this, busnum, address);

  options = options || {};

  this.options = _.defaults(options, {
    avg_samples: 0, // 0, 2, 4, 8
    data_rate: 15 //0.75, 1.5, 3, 7.5, 15, 30, 75 hz
  });

  this.address = address;
  this.raw_data = {x: 0, y: 0, z: 0};
  this.heading = 0;

  var _self = this;

  step(
    function(){
      _self._configure(this);
    },
    function done(er) {
      if (er) {
        throw new Error(er);
      }
      console.log("INIT DONE");
    }
  );
};

sys.inherits(HMC5883L, i2c_device);

HMC5883L.prototype._configure = function(cb) {
  var _self = this;
  if(_.indexOf(_.keys(_OPTIONS.avg_samples), _self.options.avg_samples.toString()) === -1) {
    cb('option "avg_samples" not in range ('+_.keys(_OPTIONS.avg_samples).join(',')+')');
  } else if(_.indexOf(_.keys(_OPTIONS.data_rate), _self.options.data_rate.toString()) === -1) {
    cb('option "data_rate" not in range ('+_.keys(_OPTIONS.data_rate).join(',')+')');
  } else {

    step(
      function ConfigA() {
        var regA = 0x00;
        regA = regA | _OPTIONS.avg_samples[_self.options.avg_samples.toString()];
        regA = regA | _OPTIONS.data_rate[_self.options.data_rate.toString()];
        _self._write8(REG_CONFA , regA, this);
      },
      function() {
        cb();
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

  console.log(_self.raw_data);


  var heading = Math.atan2(_self.raw_data.y, _self.raw_data.x);
  if ( heading < 0 ) {
    heading += 2 * Math.PI;
  }

  if ( heading > 2 * Math.PI ) {
    heading -= 2 * Math.PI;
  }
  _self.heading = heading * (180 / Math.PI);
  console.log(Math.round(_self.heading));
};
