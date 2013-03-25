
var sys = require('sys'),
    EventEmitter = require('events').EventEmitter,
    _ = require('underscore'),
    async = require('async'),
    step = require('step'),
    MCP230xx = require('./MCP230xx');


// commands
var LCD_CLEARDISPLAY    = 0x01,
    LCD_RETURNHOME      = 0x02,
    LCD_ENTRYMODESET    = 0x04,
    LCD_DISPLAYCONTROL  = 0x08,
    LCD_CURSORSHIFT     = 0x10,
    LCD_FUNCTIONSET     = 0x20,
    LCD_SETCGRAMADDR    = 0x40,
    LCD_SETDDRAMADDR    = 0x80;

//# flags for display entry mode
var LCD_ENTRYRIGHT    = 0x00,
    LCD_ENTRYLEFT     = 0x02,
    LCD_ENTRYSHIFTINCREMENT   = 0x01,
    LCD_ENTRYSHIFTDECREMENT   = 0x00;

//# flags for display on/off control
var LCD_DISPLAYON    = 0x04,
    LCD_DISPLAYOFF   = 0x00,
    LCD_CURSORON     = 0x02,
    LCD_CURSOROFF    = 0x00,
    LCD_BLINKON      = 0x01,
    LCD_BLINKOFF     = 0x00;

//# flags for display/cursor shift
var LCD_DISPLAYMOVE   = 0x08,
    LCD_CURSORMOVE    = 0x00;

//# flags for display/cursor shift
var LCD_DISPLAYMOVE   = 0x08,
    LCD_CURSORMOVE    = 0x00,
    LCD_MOVERIGHT     = 0x04,
    LCD_MOVELEFT      = 0x00;

//# flags for function set
var LCD_8BITMODE    = 0x10,
    LCD_4BITMODE    = 0x00,
    LCD_2LINE       = 0x08,
    LCD_1LINE       = 0x00,
    LCD_5x10DOTS    = 0x04,
    LCD_5x8DOTS     = 0x00;

var BUTTONS = [
  'SELECT',
  'RIGHT',
  'DOWN',
  'UP',
  'LEFT'
];

var lcdDevice = function(options, cb) {
  EventEmitter.call(this);
  var _self = this;
  options = options || {};
  options = _.defaults(options,{
    busnum: 0,
    address: 0x20,
    pin_rs: 15,
    pin_e: 13,
    pins_db: [12, 11, 10, 9],
    pin_rw: 14
  });

  this.old_btn_states = {};
  this.OUTPUT = 0;
  this.INPUT = 1;

  this.pin_rs = options.pin_rs;
  this.pin_e = options.pin_e;
  this.pin_rw = options.pin_rw;
  this.pins_db = options.pins_db;

  this.displaycontrol = 0;
  this.displayfunction = 0;
  this.displaymode = 0;

  this.numlines = 2;

  this.mcp = new MCP230xx(options.address, options.busnum, 16);

  step(
    function() {_self.mcp.init(this);},

    function() {
      _self.mcp
        .config(_self.pin_e, _self.OUTPUT)
        .config(_self.pin_rs, _self.OUTPUT)
        .config(_self.pin_rw, _self.OUTPUT, this);
    },
    function() {
      _self.mcp
        .output(_self.pin_rw, 0)
        .output(_self.pin_e, 0, this);
    },

    function() {_self.mcp.config(_self.pins_db, _self.OUTPUT, this);},

    function(){_self.write4bits(0x33,this);}, //initialization
    function(){_self.write4bits(0x32,this);}, //initialization
    function(){_self.write4bits(0x28,this);}, //2 line 5x7 matrix
    function(){_self.write4bits(0x0C,this);}, //turn cursor off 0x0E to enable cursor
    function(){_self.write4bits(0x06,this);}, //shift cursor right

    function (){
      _self.displaycontrol = LCD_DISPLAYON | LCD_CURSOROFF | LCD_BLINKOFF;

      _self.displayfunction = LCD_4BITMODE | LCD_1LINE | LCD_5x8DOTS;
      _self.displayfunction |= LCD_2LINE;
      _self.displaymode =  LCD_ENTRYLEFT | LCD_ENTRYSHIFTDECREMENT;

      _self.write4bits(LCD_ENTRYMODESET | _self.displaymode, this); //#  set the entry mode
    },
    //# turn on backlights!
    function(){
      _self.mcp.config([6,7,8], _self.OUTPUT, this);
    },
    function(){
      _self.mcp.output([6,7,8], false, this);
    },
    function() {
      // Set pullups for buttons
      _self.mcp.pullup([0,1,2,3,4], true, this);
    },
    function buttonPoll() {
      var next = this;
      BUTTONS.forEach(function(but){
        _self.old_btn_states[but] = 0;
      });
      var poller = function() {
        // Poll input buttons
        _self.mcp._readBytes(0x12, 1, function(er, data){
          for(var btn = 0; btn < BUTTONS.length; btn++) {
            var value = (data >> btn) & 0x01;

            if (_self.old_btn_states[BUTTONS[btn]] !== value) {
              _self.emit('button', {button: BUTTONS[btn], value: !value});
              _self.old_btn_states[BUTTONS[btn]] = value;
            }
          }
          // Poll buttons
          setTimeout(poller, 10);
        });
      };
      poller();
      next();
    },
    function(){
      if (_.isFunction(cb)) {
        return cb(_self);
      }
    }
  );
};

sys.inherits(lcdDevice, EventEmitter);

module.exports = lcdDevice;

lcdDevice.prototype.clear = function(cb) {
  var _self = this;
  //  # command to clear display
  _self.write4bits(LCD_CLEARDISPLAY, function(){
    setTimeout(cb, 100); //# 2000 microsecond sleep, clearing the display takes a long time
  });
};

lcdDevice.prototype.setCursor = function(col, row, cb) {
  var _self = this;
  var row_offsets = [ 0x00, 0x40, 0x14, 0x54 ];
  if ( row > _self.numlines ) {
    row = _self.numlines - 1;
  }
  _self.write4bits(LCD_SETDDRAMADDR | (col + row_offsets[row]), cb);
};

lcdDevice.prototype.message = function(message, cb) {
  var _self = this;
  var messageBuffer = new Buffer(message);
  async.eachSeries(messageBuffer, function(ch, callback){
    if (ch === 10) {
      ch = 0xC0;
      _self.write4bits(ch, false, callback);
    } else {
      _self.write4bits(ch,true,callback);
    }
  },cb);
};

lcdDevice.prototype.blink = function(cb) {
  var _self = this;
  _self.displaycontrol |= LCD_BLINKON;
  _self.write4bits(LCD_DISPLAYCONTROL | _self.displaycontrol, cb);
};

lcdDevice.prototype.cursor = function(cb) {
  var _self = this;
  _self.displaycontrol |= LCD_CURSORON;
  _self.write4bits(LCD_DISPLAYCONTROL | _self.displaycontrol, cb);
};

lcdDevice.prototype.noDisplay = function(cb) {
  var _self = this;
  _self.displaycontrol &= ~LCD_DISPLAYON;
  _self.write4bits(LCD_DISPLAYCONTROL | _self.displaycontrol, cb);
};

lcdDevice.prototype.display = function(cb) {
  var _self = this;
  _self.displaycontrol |= LCD_DISPLAYON;
  _self.write4bits(LCD_DISPLAYCONTROL | _self.displaycontrol, cb);
};

lcdDevice.prototype.backlight = function(color, cb) {
  var _self = this;
  _self.mcp
    .output(6, !color & 0x01)
    .output(7, !color & 0x02)
    .output(8, !color & 0x04, cb);
};

lcdDevice.prototype.write4bits = function(bits, char_mode, cb) {
  var _self = this;
  if (_.isFunction(char_mode)) {
    cb = char_mode;
    char_mode = false;
  }

  if (!char_mode) {
    char_mode = false;
  }

  if (!_.isFunction(cb)){
    throw new Error('write4bits: missing callback');
  }

  step(
    function setCharMode() {
      _self.mcp.output(_self.pin_rs, char_mode, this);
    },

    function upperx(){
      _self.mcp
        .output(_self.pins_db[0], ((bits>>4)&0x01))
        .output(_self.pins_db[1], ((bits>>5)&0x01))
        .output(_self.pins_db[2], ((bits>>6)&0x01))
        .output(_self.pins_db[3], ((bits>>7)&0x01), this);
    },

    function enable1(er) {
      if (er) {cb(er);return;}
      var next = this;
      _self.pulseEnable(next);
    },

    function lowerx(){
      _self.mcp
        .output(_self.pins_db[0], ((bits>>0)&0x01))
        .output(_self.pins_db[1], ((bits>>1)&0x01))
        .output(_self.pins_db[2], ((bits>>2)&0x01))
        .output(_self.pins_db[3], ((bits>>3)&0x01), this);
    },

    function enable2(er) {
      if (er) {cb(er);return;}
      _self.pulseEnable(cb);
    }
  );
};

lcdDevice.prototype.pulseEnable = function(cb) {
  var _self = this;
  _self.mcp.output(_self.pin_e, true, function(er){
    if (er) {cb(er);return;}
//    setTimeout(function(){
    _self.mcp.output(_self.pin_e, false, cb);
//    },5);
  });
};
