require('./sourcemap-register.js');/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 421:
/***/ ((module) => {

var charenc = {
  // UTF-8 encoding
  utf8: {
    // Convert a string to a byte array
    stringToBytes: function(str) {
      return charenc.bin.stringToBytes(unescape(encodeURIComponent(str)));
    },

    // Convert a byte array to a string
    bytesToString: function(bytes) {
      return decodeURIComponent(escape(charenc.bin.bytesToString(bytes)));
    }
  },

  // Binary encoding
  bin: {
    // Convert a string to a byte array
    stringToBytes: function(str) {
      for (var bytes = [], i = 0; i < str.length; i++)
        bytes.push(str.charCodeAt(i) & 0xFF);
      return bytes;
    },

    // Convert a byte array to a string
    bytesToString: function(bytes) {
      for (var str = [], i = 0; i < bytes.length; i++)
        str.push(String.fromCharCode(bytes[i]));
      return str.join('');
    }
  }
};

module.exports = charenc;


/***/ }),

/***/ 935:
/***/ ((module) => {

(function() {
  var base64map
      = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',

  crypt = {
    // Bit-wise rotation left
    rotl: function(n, b) {
      return (n << b) | (n >>> (32 - b));
    },

    // Bit-wise rotation right
    rotr: function(n, b) {
      return (n << (32 - b)) | (n >>> b);
    },

    // Swap big-endian to little-endian and vice versa
    endian: function(n) {
      // If number given, swap endian
      if (n.constructor == Number) {
        return crypt.rotl(n, 8) & 0x00FF00FF | crypt.rotl(n, 24) & 0xFF00FF00;
      }

      // Else, assume array and swap all items
      for (var i = 0; i < n.length; i++)
        n[i] = crypt.endian(n[i]);
      return n;
    },

    // Generate an array of any length of random bytes
    randomBytes: function(n) {
      for (var bytes = []; n > 0; n--)
        bytes.push(Math.floor(Math.random() * 256));
      return bytes;
    },

    // Convert a byte array to big-endian 32-bit words
    bytesToWords: function(bytes) {
      for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8)
        words[b >>> 5] |= bytes[i] << (24 - b % 32);
      return words;
    },

    // Convert big-endian 32-bit words to a byte array
    wordsToBytes: function(words) {
      for (var bytes = [], b = 0; b < words.length * 32; b += 8)
        bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
      return bytes;
    },

    // Convert a byte array to a hex string
    bytesToHex: function(bytes) {
      for (var hex = [], i = 0; i < bytes.length; i++) {
        hex.push((bytes[i] >>> 4).toString(16));
        hex.push((bytes[i] & 0xF).toString(16));
      }
      return hex.join('');
    },

    // Convert a hex string to a byte array
    hexToBytes: function(hex) {
      for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
      return bytes;
    },

    // Convert a byte array to a base-64 string
    bytesToBase64: function(bytes) {
      for (var base64 = [], i = 0; i < bytes.length; i += 3) {
        var triplet = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
        for (var j = 0; j < 4; j++)
          if (i * 8 + j * 6 <= bytes.length * 8)
            base64.push(base64map.charAt((triplet >>> 6 * (3 - j)) & 0x3F));
          else
            base64.push('=');
      }
      return base64.join('');
    },

    // Convert a base-64 string to a byte array
    base64ToBytes: function(base64) {
      // Remove non-base-64 characters
      base64 = base64.replace(/[^A-Z0-9+\/]/ig, '');

      for (var bytes = [], i = 0, imod4 = 0; i < base64.length;
          imod4 = ++i % 4) {
        if (imod4 == 0) continue;
        bytes.push(((base64map.indexOf(base64.charAt(i - 1))
            & (Math.pow(2, -2 * imod4 + 8) - 1)) << (imod4 * 2))
            | (base64map.indexOf(base64.charAt(i)) >>> (6 - imod4 * 2)));
      }
      return bytes;
    }
  };

  module.exports = crypt;
})();


/***/ }),

/***/ 525:
/***/ ((__unused_webpack_module, exports) => {

"use strict";
Object.defineProperty(exports, "__esModule", ({value:!0})),exports.promisify=promisify;var customArgumentsToken="__ES6-PROMISIFY--CUSTOM-ARGUMENTS__";function promisify(a){if("function"!=typeof a)throw new TypeError("Argument to promisify must be a function");var b=a[customArgumentsToken],c=promisify.Promise||Promise;if("function"!=typeof c)throw new Error("No Promise implementation found; do you need a polyfill?");return function(){for(var d=this,e=arguments.length,f=Array(e),g=0;g<e;g++)f[g]=arguments[g];return new c(function(c,e){f.push(function(a){if(a)return e(a);for(var d=arguments.length,f=Array(1<d?d-1:0),g=1;g<d;g++)f[g-1]=arguments[g];if(1===f.length||!b)return c(f[0]);var h={};f.forEach(function(a,c){var d=b[c];d&&(h[d]=a)}),c(h)}),a.apply(d,f)})}}promisify.argumentNames="__ES6-PROMISIFY--CUSTOM-ARGUMENTS__",promisify.Promise=void 0;


/***/ }),

/***/ 625:
/***/ ((module) => {

/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}


/***/ }),

/***/ 126:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var fs = __nccwpck_require__(147)
var core
if (process.platform === 'win32' || global.TESTING_WINDOWS) {
  core = __nccwpck_require__(1)
} else {
  core = __nccwpck_require__(728)
}

module.exports = isexe
isexe.sync = sync

function isexe (path, options, cb) {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }

  if (!cb) {
    if (typeof Promise !== 'function') {
      throw new TypeError('callback not provided')
    }

    return new Promise(function (resolve, reject) {
      isexe(path, options || {}, function (er, is) {
        if (er) {
          reject(er)
        } else {
          resolve(is)
        }
      })
    })
  }

  core(path, options || {}, function (er, is) {
    // ignore EACCES because that just means we aren't allowed to run it
    if (er) {
      if (er.code === 'EACCES' || options && options.ignoreErrors) {
        er = null
        is = false
      }
    }
    cb(er, is)
  })
}

function sync (path, options) {
  // my kingdom for a filtered catch
  try {
    return core.sync(path, options || {})
  } catch (er) {
    if (options && options.ignoreErrors || er.code === 'EACCES') {
      return false
    } else {
      throw er
    }
  }
}


/***/ }),

/***/ 728:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

module.exports = isexe
isexe.sync = sync

var fs = __nccwpck_require__(147)

function isexe (path, options, cb) {
  fs.stat(path, function (er, stat) {
    cb(er, er ? false : checkStat(stat, options))
  })
}

function sync (path, options) {
  return checkStat(fs.statSync(path), options)
}

function checkStat (stat, options) {
  return stat.isFile() && checkMode(stat, options)
}

function checkMode (stat, options) {
  var mod = stat.mode
  var uid = stat.uid
  var gid = stat.gid

  var myUid = options.uid !== undefined ?
    options.uid : process.getuid && process.getuid()
  var myGid = options.gid !== undefined ?
    options.gid : process.getgid && process.getgid()

  var u = parseInt('100', 8)
  var g = parseInt('010', 8)
  var o = parseInt('001', 8)
  var ug = u | g

  var ret = (mod & o) ||
    (mod & g) && gid === myGid ||
    (mod & u) && uid === myUid ||
    (mod & ug) && myUid === 0

  return ret
}


/***/ }),

/***/ 1:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

module.exports = isexe
isexe.sync = sync

var fs = __nccwpck_require__(147)

function checkPathExt (path, options) {
  var pathext = options.pathExt !== undefined ?
    options.pathExt : process.env.PATHEXT

  if (!pathext) {
    return true
  }

  pathext = pathext.split(';')
  if (pathext.indexOf('') !== -1) {
    return true
  }
  for (var i = 0; i < pathext.length; i++) {
    var p = pathext[i].toLowerCase()
    if (p && path.substr(-p.length).toLowerCase() === p) {
      return true
    }
  }
  return false
}

function checkStat (stat, path, options) {
  if (!stat.isSymbolicLink() && !stat.isFile()) {
    return false
  }
  return checkPathExt(path, options)
}

function isexe (path, options, cb) {
  fs.stat(path, function (er, stat) {
    cb(er, er ? false : checkStat(stat, path, options))
  })
}

function sync (path, options) {
  return checkStat(fs.statSync(path), path, options)
}


/***/ }),

/***/ 711:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

(function(){
  var crypt = __nccwpck_require__(935),
      utf8 = (__nccwpck_require__(421).utf8),
      isBuffer = __nccwpck_require__(625),
      bin = (__nccwpck_require__(421).bin),

  // The core
  md5 = function (message, options) {
    // Convert to byte array
    if (message.constructor == String)
      if (options && options.encoding === 'binary')
        message = bin.stringToBytes(message);
      else
        message = utf8.stringToBytes(message);
    else if (isBuffer(message))
      message = Array.prototype.slice.call(message, 0);
    else if (!Array.isArray(message) && message.constructor !== Uint8Array)
      message = message.toString();
    // else, assume byte array already

    var m = crypt.bytesToWords(message),
        l = message.length * 8,
        a =  1732584193,
        b = -271733879,
        c = -1732584194,
        d =  271733878;

    // Swap endian
    for (var i = 0; i < m.length; i++) {
      m[i] = ((m[i] <<  8) | (m[i] >>> 24)) & 0x00FF00FF |
             ((m[i] << 24) | (m[i] >>>  8)) & 0xFF00FF00;
    }

    // Padding
    m[l >>> 5] |= 0x80 << (l % 32);
    m[(((l + 64) >>> 9) << 4) + 14] = l;

    // Method shortcuts
    var FF = md5._ff,
        GG = md5._gg,
        HH = md5._hh,
        II = md5._ii;

    for (var i = 0; i < m.length; i += 16) {

      var aa = a,
          bb = b,
          cc = c,
          dd = d;

      a = FF(a, b, c, d, m[i+ 0],  7, -680876936);
      d = FF(d, a, b, c, m[i+ 1], 12, -389564586);
      c = FF(c, d, a, b, m[i+ 2], 17,  606105819);
      b = FF(b, c, d, a, m[i+ 3], 22, -1044525330);
      a = FF(a, b, c, d, m[i+ 4],  7, -176418897);
      d = FF(d, a, b, c, m[i+ 5], 12,  1200080426);
      c = FF(c, d, a, b, m[i+ 6], 17, -1473231341);
      b = FF(b, c, d, a, m[i+ 7], 22, -45705983);
      a = FF(a, b, c, d, m[i+ 8],  7,  1770035416);
      d = FF(d, a, b, c, m[i+ 9], 12, -1958414417);
      c = FF(c, d, a, b, m[i+10], 17, -42063);
      b = FF(b, c, d, a, m[i+11], 22, -1990404162);
      a = FF(a, b, c, d, m[i+12],  7,  1804603682);
      d = FF(d, a, b, c, m[i+13], 12, -40341101);
      c = FF(c, d, a, b, m[i+14], 17, -1502002290);
      b = FF(b, c, d, a, m[i+15], 22,  1236535329);

      a = GG(a, b, c, d, m[i+ 1],  5, -165796510);
      d = GG(d, a, b, c, m[i+ 6],  9, -1069501632);
      c = GG(c, d, a, b, m[i+11], 14,  643717713);
      b = GG(b, c, d, a, m[i+ 0], 20, -373897302);
      a = GG(a, b, c, d, m[i+ 5],  5, -701558691);
      d = GG(d, a, b, c, m[i+10],  9,  38016083);
      c = GG(c, d, a, b, m[i+15], 14, -660478335);
      b = GG(b, c, d, a, m[i+ 4], 20, -405537848);
      a = GG(a, b, c, d, m[i+ 9],  5,  568446438);
      d = GG(d, a, b, c, m[i+14],  9, -1019803690);
      c = GG(c, d, a, b, m[i+ 3], 14, -187363961);
      b = GG(b, c, d, a, m[i+ 8], 20,  1163531501);
      a = GG(a, b, c, d, m[i+13],  5, -1444681467);
      d = GG(d, a, b, c, m[i+ 2],  9, -51403784);
      c = GG(c, d, a, b, m[i+ 7], 14,  1735328473);
      b = GG(b, c, d, a, m[i+12], 20, -1926607734);

      a = HH(a, b, c, d, m[i+ 5],  4, -378558);
      d = HH(d, a, b, c, m[i+ 8], 11, -2022574463);
      c = HH(c, d, a, b, m[i+11], 16,  1839030562);
      b = HH(b, c, d, a, m[i+14], 23, -35309556);
      a = HH(a, b, c, d, m[i+ 1],  4, -1530992060);
      d = HH(d, a, b, c, m[i+ 4], 11,  1272893353);
      c = HH(c, d, a, b, m[i+ 7], 16, -155497632);
      b = HH(b, c, d, a, m[i+10], 23, -1094730640);
      a = HH(a, b, c, d, m[i+13],  4,  681279174);
      d = HH(d, a, b, c, m[i+ 0], 11, -358537222);
      c = HH(c, d, a, b, m[i+ 3], 16, -722521979);
      b = HH(b, c, d, a, m[i+ 6], 23,  76029189);
      a = HH(a, b, c, d, m[i+ 9],  4, -640364487);
      d = HH(d, a, b, c, m[i+12], 11, -421815835);
      c = HH(c, d, a, b, m[i+15], 16,  530742520);
      b = HH(b, c, d, a, m[i+ 2], 23, -995338651);

      a = II(a, b, c, d, m[i+ 0],  6, -198630844);
      d = II(d, a, b, c, m[i+ 7], 10,  1126891415);
      c = II(c, d, a, b, m[i+14], 15, -1416354905);
      b = II(b, c, d, a, m[i+ 5], 21, -57434055);
      a = II(a, b, c, d, m[i+12],  6,  1700485571);
      d = II(d, a, b, c, m[i+ 3], 10, -1894986606);
      c = II(c, d, a, b, m[i+10], 15, -1051523);
      b = II(b, c, d, a, m[i+ 1], 21, -2054922799);
      a = II(a, b, c, d, m[i+ 8],  6,  1873313359);
      d = II(d, a, b, c, m[i+15], 10, -30611744);
      c = II(c, d, a, b, m[i+ 6], 15, -1560198380);
      b = II(b, c, d, a, m[i+13], 21,  1309151649);
      a = II(a, b, c, d, m[i+ 4],  6, -145523070);
      d = II(d, a, b, c, m[i+11], 10, -1120210379);
      c = II(c, d, a, b, m[i+ 2], 15,  718787259);
      b = II(b, c, d, a, m[i+ 9], 21, -343485551);

      a = (a + aa) >>> 0;
      b = (b + bb) >>> 0;
      c = (c + cc) >>> 0;
      d = (d + dd) >>> 0;
    }

    return crypt.endian([a, b, c, d]);
  };

  // Auxiliary functions
  md5._ff  = function (a, b, c, d, x, s, t) {
    var n = a + (b & c | ~b & d) + (x >>> 0) + t;
    return ((n << s) | (n >>> (32 - s))) + b;
  };
  md5._gg  = function (a, b, c, d, x, s, t) {
    var n = a + (b & d | c & ~d) + (x >>> 0) + t;
    return ((n << s) | (n >>> (32 - s))) + b;
  };
  md5._hh  = function (a, b, c, d, x, s, t) {
    var n = a + (b ^ c ^ d) + (x >>> 0) + t;
    return ((n << s) | (n >>> (32 - s))) + b;
  };
  md5._ii  = function (a, b, c, d, x, s, t) {
    var n = a + (c ^ (b | ~d)) + (x >>> 0) + t;
    return ((n << s) | (n >>> (32 - s))) + b;
  };

  // Package private blocksize
  md5._blocksize = 16;
  md5._digestsize = 16;

  module.exports = function (message, options) {
    if (message === undefined || message === null)
      throw new Error('Illegal argument ' + message);

    var digestbytes = crypt.wordsToBytes(md5(message, options));
    return options && options.asBytes ? digestbytes :
        options && options.asString ? bin.bytesToString(digestbytes) :
        crypt.bytesToHex(digestbytes);
  };

})();


/***/ }),

/***/ 284:
/***/ ((module) => {

"use strict";

var isWindows = process.platform === 'win32';
var trailingSlashRe = isWindows ? /[^:]\\$/ : /.\/$/;

// https://github.com/nodejs/node/blob/3e7a14381497a3b73dda68d05b5130563cdab420/lib/os.js#L25-L43
module.exports = function () {
	var path;

	if (isWindows) {
		path = process.env.TEMP ||
			process.env.TMP ||
			(process.env.SystemRoot || process.env.windir) + '\\temp';
	} else {
		path = process.env.TMPDIR ||
			process.env.TMP ||
			process.env.TEMP ||
			'/tmp';
	}

	if (trailingSlashRe.test(path)) {
		path = path.slice(0, -1);
	}

	return path;
};


/***/ }),

/***/ 207:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const isWindows = process.platform === 'win32' ||
    process.env.OSTYPE === 'cygwin' ||
    process.env.OSTYPE === 'msys'

const path = __nccwpck_require__(17)
const COLON = isWindows ? ';' : ':'
const isexe = __nccwpck_require__(126)

const getNotFoundError = (cmd) =>
  Object.assign(new Error(`not found: ${cmd}`), { code: 'ENOENT' })

const getPathInfo = (cmd, opt) => {
  const colon = opt.colon || COLON

  // If it has a slash, then we don't bother searching the pathenv.
  // just check the file itself, and that's it.
  const pathEnv = cmd.match(/\//) || isWindows && cmd.match(/\\/) ? ['']
    : (
      [
        // windows always checks the cwd first
        ...(isWindows ? [process.cwd()] : []),
        ...(opt.path || process.env.PATH ||
          /* istanbul ignore next: very unusual */ '').split(colon),
      ]
    )
  const pathExtExe = isWindows
    ? opt.pathExt || process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM'
    : ''
  const pathExt = isWindows ? pathExtExe.split(colon) : ['']

  if (isWindows) {
    if (cmd.indexOf('.') !== -1 && pathExt[0] !== '')
      pathExt.unshift('')
  }

  return {
    pathEnv,
    pathExt,
    pathExtExe,
  }
}

const which = (cmd, opt, cb) => {
  if (typeof opt === 'function') {
    cb = opt
    opt = {}
  }
  if (!opt)
    opt = {}

  const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt)
  const found = []

  const step = i => new Promise((resolve, reject) => {
    if (i === pathEnv.length)
      return opt.all && found.length ? resolve(found)
        : reject(getNotFoundError(cmd))

    const ppRaw = pathEnv[i]
    const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw

    const pCmd = path.join(pathPart, cmd)
    const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd
      : pCmd

    resolve(subStep(p, i, 0))
  })

  const subStep = (p, i, ii) => new Promise((resolve, reject) => {
    if (ii === pathExt.length)
      return resolve(step(i + 1))
    const ext = pathExt[ii]
    isexe(p + ext, { pathExt: pathExtExe }, (er, is) => {
      if (!er && is) {
        if (opt.all)
          found.push(p + ext)
        else
          return resolve(p + ext)
      }
      return resolve(subStep(p, i, ii + 1))
    })
  })

  return cb ? step(0).then(res => cb(null, res), cb) : step(0)
}

const whichSync = (cmd, opt) => {
  opt = opt || {}

  const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt)
  const found = []

  for (let i = 0; i < pathEnv.length; i ++) {
    const ppRaw = pathEnv[i]
    const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw

    const pCmd = path.join(pathPart, cmd)
    const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd
      : pCmd

    for (let j = 0; j < pathExt.length; j ++) {
      const cur = p + pathExt[j]
      try {
        const is = isexe.sync(cur, { pathExt: pathExtExe })
        if (is) {
          if (opt.all)
            found.push(cur)
          else
            return cur
        }
      } catch (ex) {}
    }
  }

  if (opt.all && found.length)
    return found

  if (opt.nothrow)
    return null

  throw getNotFoundError(cmd)
}

module.exports = which
which.sync = whichSync


/***/ }),

/***/ 81:
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ 113:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 808:
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),

/***/ 17:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 254:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


var openssl = __nccwpck_require__(702)
var helper = __nccwpck_require__(649)
var {debug} = __nccwpck_require__(762)

// PEM format: .pem, .crt, .cer (!bin), .key
// base64 encoded; the cert file might also include the private key; so key file is optional

// DER format: .der, .cer (bin)
// binary encoded format; cannot include key file

// PKCS#7 / P7B format: .p7b, .p7c
// contains cert and ca chain cert files, but not the key file
// A PKCS7 certificate is serialized using either PEM or DER format.

// PKCS#12 / PFX format: .pfx, .p12
// contains all files: key file, cert and ca chain cert files

/**
 * pem convert module
 *
 * @module convert
 */

/**
 * conversion from PEM to DER format
 * if private key is included in PEM encoded file, it won't be included in DER file
 * use this method with type 'rsa' to export private key in that case
 * @param  {String} pathIN  path of the PEM encoded certificate file
 * @param  {String} pathOUT path of the DER encoded certificate file to generate
 * @param  {String} [type] type of file, use 'rsa' for key file, 'x509' otherwise or leave this parameter out
 * @param  {Function} callback callback method called with error, boolean result
 */
module.exports.PEM2DER = function (pathIN, pathOUT, type, callback) {
  if (!callback && typeof type === 'function') {
    callback = type
    type = 'x509'
  }
  var params = [
    type,
    '-outform',
    'der',
    '-in',
    pathIN,
    '-out',
    pathOUT
  ]
  openssl.spawnWrapper(params, false, function (error, code) {
    if (error) {
      callback(error)
    } else {
      callback(null, code === 0)
    }
  })
}

/**
 * conversion from DER to PEM format
 * @param  {String} pathIN  path of the DER encoded certificate file
 * @param  {String} pathOUT path of the PEM encoded certificate file to generate
 * @param  {String} [type] type of file, use 'rsa' for key file, 'x509' otherwise or leave this parameter out
 * @param  {Function} callback callback method called with error, boolean result
 */
module.exports.DER2PEM = function (pathIN, pathOUT, type, callback) {
  if (!callback && typeof type === 'function') {
    callback = type
    type = 'x509'
  }
  var params = [
    type,
    '-inform',
    'der',
    '-in',
    pathIN,
    '-out',
    pathOUT
  ]
  openssl.spawnWrapper(params, false, function (error, code) {
    if (error) {
      callback(error)
    } else {
      callback(null, code === 0)
    }
  })
}

/**
 * conversion from PEM to P7B format
 * @param  {Object} pathBundleIN  paths of the PEM encoded certificate files ({cert: '...', ca: '...' or ['...', ...]})
 * @param  {String} pathOUT path of the P7B encoded certificate file to generate
 * @param  {Function} callback callback method called with error, boolean result
 */
module.exports.PEM2P7B = function (pathBundleIN, pathOUT, callback) {
  var params = [
    'crl2pkcs7',
    '-nocrl',
    '-certfile',
    pathBundleIN.cert,
    '-out',
    pathOUT
  ]
  if (pathBundleIN.ca) {
    if (!Array.isArray(pathBundleIN.ca)) {
      pathBundleIN.ca = [pathBundleIN.ca]
    }
    pathBundleIN.ca.forEach(function (ca) {
      params.push('-certfile')
      params.push(ca)
    })
  }
  openssl.spawnWrapper(params, false, function (error, code) {
    if (error) {
      callback(error)
    } else {
      callback(null, code === 0)
    }
  })
}

/**
 * conversion from P7B to PEM format
 * @param  {String} pathIN  path of the P7B encoded certificate file
 * @param  {String} pathOUT path of the PEM encoded certificate file to generate
 * @param  {Function} callback callback method called with error, boolean result
 */
module.exports.P7B2PEM = function (pathIN, pathOUT, callback) {
  var params = [
    'pkcs7',
    '-print_certs',
    '-in',
    pathIN,
    '-out',
    pathOUT
  ]
  openssl.spawnWrapper(params, false, function (error, code) {
    if (error) {
      callback(error)
    } else {
      callback(null, code === 0)
    }
  })
}// TODO: CA also included?

/**
 * conversion from PEM to PFX
 * @param  {Object} pathBundleIN paths of the PEM encoded certificate files ({cert: '...', key: '...', ca: '...' or ['...', ...]})
 * @param  {String} pathOUT path of the PFX encoded certificate file to generate
 * @param  {String} password password to set for accessing the PFX file
 * @param  {Function} callback callback method called with error, boolean result
 */
module.exports.PEM2PFX = function (pathBundleIN, pathOUT, password, callback) {
  var params = [
    'pkcs12',
    '-export',
    '-out',
    pathOUT,
    '-inkey',
    pathBundleIN.key,
    '-in',
    pathBundleIN.cert
  ]
  if (pathBundleIN.ca) {
    if (!Array.isArray(pathBundleIN.ca)) {
      pathBundleIN.ca = [pathBundleIN.ca]
    }
    pathBundleIN.ca.forEach(function (ca) {
      params.push('-certfile')
      params.push(ca)
    })
  }
  var delTempPWFiles = []
  helper.createPasswordFile({ cipher: '', password: password, passType: 'in' }, params, delTempPWFiles)
  helper.createPasswordFile({ cipher: '', password: password, passType: 'out' }, params, delTempPWFiles)
  openssl.spawnWrapper(params, false, function (error, code) {
    function done (error) {
      if (error) {
        callback(error)
      } else {
        callback(null, code === 0)
      }
    }
    helper.deleteTempFiles(delTempPWFiles, function (fsErr) {
      done(error || fsErr)
    })
  })
}

/**
 * conversion from PFX to PEM
 * @param  {Object} pathIN  path of the PFX encoded certificate file
 * @param  {String} pathOUT path of the PEM encoded certificate file to generate
 * @param  {String} password password to set for accessing the PFX file
 * @param  {Function} callback callback method called with error, boolean result
 */
module.exports.PFX2PEM = function (pathIN, pathOUT, password, callback) {
  var params = [
    'pkcs12',
    '-in',
    pathIN,
    '-out',
    pathOUT,
    '-nodes'
  ]
  var delTempPWFiles = []
  helper.createPasswordFile({ cipher: '', password: password, passType: 'in' }, params, delTempPWFiles)
  helper.createPasswordFile({ cipher: '', password: password, passType: 'out' }, params, delTempPWFiles)
  openssl.spawnWrapper(params, false, function (error, code) {
    function done (error) {
      if (error) {
        callback(error)
      } else {
        callback(null, code === 0)
      }
    }
    helper.deleteTempFiles(delTempPWFiles, function (fsErr) {
      done(error || fsErr)
    })
  })
}

/**
 * conversion from P7B to PFX/PKCS#12
 * @param  {Object} pathBundleIN  paths of the PEM encoded certificate files ({cert: '...', key: '...', ca: '...' or ['...', ...]})
 * @param  {String} pathOUT path of the PFX certificate file to generate
 * @param  {String} password password to be set for the PFX file and to be used to access the key file
 * @param  {Function} callback callback method called with error, boolean result
 */
module.exports.P7B2PFX = function (pathBundleIN, pathOUT, password, callback) {
  var tmpfile = pathBundleIN.cert.replace(/\.[^.]+$/, '.cer')
  var params = [
    'pkcs7',
    '-print_certs',
    '-in',
    pathBundleIN.cert,
    '-out',
    tmpfile
  ]
  openssl.spawnWrapper(params, false, function (error, code) {
    debug("P7B2PFX", {
      error, code
    })
    if (error) {
      callback(error)
    } else {
      var params = [
        'pkcs12',
        '-export',
        '-in',
        tmpfile,
        '-inkey',
        pathBundleIN.key,
        '-out',
        pathOUT
      ]
      if (pathBundleIN.ca) {
        if (!Array.isArray(pathBundleIN.ca)) {
          pathBundleIN.ca = [pathBundleIN.ca]
        }
        pathBundleIN.ca.forEach(function (ca) {
          params.push('-certfile')
          params.push(ca)
        })
      }
      var delTempPWFiles = [tmpfile]
      helper.createPasswordFile({ cipher: '', password: password, passType: 'in' }, params, delTempPWFiles)
      helper.createPasswordFile({ cipher: '', password: password, passType: 'out' }, params, delTempPWFiles)
      openssl.spawnWrapper(params, false, function (error, code) {
        function done (error) {
          if (error) {
            callback(error)
          } else {
            callback(null, code === 0)
          }
        }
        helper.deleteTempFiles(delTempPWFiles, function (fsErr) {
          done(error || fsErr)
        })
      })
    }
  })
}


/***/ }),

/***/ 762:
/***/ ((module) => {

function debug (title, content) {
  if (process.env.CI === 'true') {
    console.log(`::group::${title}`)
    console.log(JSON.stringify(content, null, 3))
    console.log('::endgroup::')
  }
}

module.exports = {
  debug: debug
}


/***/ }),

/***/ 649:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


var pathlib = __nccwpck_require__(17)
var fs = __nccwpck_require__(147)
var crypto = __nccwpck_require__(113)
var osTmpdir = __nccwpck_require__(284)
var tempDir = process.env.PEMJS_TMPDIR || osTmpdir()

/**
 * pem helper module
 *
 * @module helper
 */

/**
 * helper function to check is the string a number or not
 * @param {String} str String that should be checked to be a number
 */
module.exports.isNumber = function (str) {
  if (Array.isArray(str)) {
    return false
  }
  /*
  var bstr = str && str.toString()
  str = str + ''

  return bstr - parseFloat(bstr) + 1 >= 0 &&
          !/^\s+|\s+$/g.test(str) && /^\d+$/g.test(str) &&
          !isNaN(str) && !isNaN(parseFloat(str))
  */
  return /^\d+$/g.test(str)
}

/**
 * helper function to check is the string a hexaceximal value
 * @param {String} hex String that should be checked to be a hexaceximal
 */
module.exports.isHex = function isHex (hex) {
  return /^(0x){0,1}([0-9A-F]{1,40}|[0-9A-F]{1,40})$/gi.test(hex)
}

/**
 * helper function to convert a string to a hexaceximal value
 * @param {String} str String that should be converted to a hexaceximal
 */
module.exports.toHex = function toHex (str) {
  var hex = ''
  for (var i = 0; i < str.length; i++) {
    hex += '' + str.charCodeAt(i).toString(16)
  }
  return hex
}

// cipherPassword returns an array of supported ciphers.
/**
 * list of supported ciphers
 * @type {Array}
 */
module.exports.ciphers = ['aes128', 'aes192', 'aes256', 'camellia128', 'camellia192', 'camellia256', 'des', 'des3', 'idea']
var ciphers = module.exports.ciphers

/**
 * Creates a PasswordFile to hide the password form process infos via `ps auxf` etc.
 * @param {Object} options object of cipher, password and passType, mustPass, {cipher:'aes128', password:'xxxx', passType:"in/out/word"}, if the object empty we do nothing
 * @param {String} options.cipher cipher like 'aes128', 'aes192', 'aes256', 'camellia128', 'camellia192', 'camellia256', 'des', 'des3', 'idea'
 * @param {String} options.password password can be empty or at last 4 to 1023 chars
 * @param {String} options.passType passType: can be in/out/word for passIN/passOUT/passWORD
 * @param {Boolean} options.mustPass mustPass is used when you need to set the pass like as "-password pass:" most needed when empty password
 * @param {Object} params params will be extended with the data that need for the openssl command. IS USED AS POINTER!
 * @param {String} PasswordFileArray PasswordFileArray is an array of filePaths that later need to deleted ,after the openssl command. IS USED AS POINTER!
 * @return {Boolean} result
 */
module.exports.createPasswordFile = function (options, params, PasswordFileArray) {
  if (!options || !Object.prototype.hasOwnProperty.call(options, 'password') || !Object.prototype.hasOwnProperty.call(options, 'passType') || !/^(word|in|out)$/.test(options.passType)) {
    return false
  }
  var PasswordFile = pathlib.join(tempDir, crypto.randomBytes(20).toString('hex'))
  PasswordFileArray.push(PasswordFile)
  options.password = options.password.trim()
  if (options.password === '') {
    options.mustPass = true
  }
  if (options.cipher && (ciphers.indexOf(options.cipher) !== -1)) {
    params.push('-' + options.cipher)
  }
  params.push('-pass' + options.passType)
  if (options.mustPass) {
    params.push('pass:' + options.password)
  } else {
    fs.writeFileSync(PasswordFile, options.password)
    params.push('file:' + PasswordFile)
  }
  return true
}

/**
 * Deletes a file or an array of files
 * @param {Array} files array of files that shoudld be deleted
 * @param {errorCallback} callback Callback function with an error object
 */
module.exports.deleteTempFiles = function (files, callback) {
  var rmFiles = []
  if (typeof files === 'string') {
    rmFiles.push(files)
  } else if (Array.isArray(files)) {
    rmFiles = files
  } else {
    return callback(new Error('Unexcepted files parameter type; only string or array supported'))
  }
  var deleteSeries = function (list, finalCallback) {
    if (list.length) {
      var file = list.shift()
      var myCallback = function (err) {
        if (err && err.code === 'ENOENT') {
          // file doens't exist
          return deleteSeries(list, finalCallback)
        } else if (err) {
          // other errors, e.g. maybe we don't have enough permission
          return finalCallback(err)
        } else {
          return deleteSeries(list, finalCallback)
        }
      }
      if (file && typeof file === 'string') {
        fs.unlink(file, myCallback)
      } else {
        return deleteSeries(list, finalCallback)
      }
    } else {
      return finalCallback(null) // no errors
    }
  }
  deleteSeries(rmFiles, callback)
}
/**
 * Callback for return an error object.
 * @callback errorCallback
 * @param {Error} err - An Error Object or null
 */


/***/ }),

/***/ 702:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var helper = __nccwpck_require__(649)
var {debug} = __nccwpck_require__(762)
var cpspawn = (__nccwpck_require__(81).spawn)
var spawnSync = (__nccwpck_require__(81).spawnSync)
var pathlib = __nccwpck_require__(17)
var fs = __nccwpck_require__(147)
var osTmpdir = __nccwpck_require__(284)
var crypto = __nccwpck_require__(113)
var which = __nccwpck_require__(207)
var settings = {}
var tempDir = process.env.PEMJS_TMPDIR || osTmpdir()

const versionRegEx = new RegExp('^(OpenSSL|LibreSSL) (((\\d+).(\\d+)).(\\d+))([a-z]+)?')

if ("CI" in process.env && process.env.CI === 'true') {
  if ("LIBRARY" in process.env && "VERSION" in process.env && process.env.LIBRARY != "" && process.env.VERSION != "") {
    const filePathOpenSSL=`./openssl/${process.env.LIBRARY}_v${process.env.VERSION}/bin/openssl`
    if (fs.existsSync(filePathOpenSSL)) {
      process.env.OPENSSL_BIN = filePathOpenSSL
    }
  }
}

/**
 * pem openssl module
 *
 * @module openssl
 */

/**
 * configue this openssl module
 *
 * @static
 * @param {String} option name e.g. pathOpenSSL, openSslVersion; TODO rethink nomenclature
 * @param {*} value value
 */
function set(option, value) {
  settings[option] = value
}

/**
 * get configuration setting value
 *
 * @static
 * @param {String} option name
 */
function get(option) {
  return settings[option] || null
}

/**
 * Spawn an openssl command
 *
 * @static
 * @param {Array} params Array of openssl command line parameters
 * @param {String} searchStr String to use to find data
 * @param {Array} [tmpfiles] list of temporary files
 * @param {Function} callback Called with (error, stdout-substring)
 */
function exec(params, searchStr, tmpfiles, callback) {
  if (!callback && typeof tmpfiles === 'function') {
    callback = tmpfiles
    tmpfiles = false
  }

  spawnWrapper(params, tmpfiles, function (err, code, stdout, stderr) {
    var start, end

    if (err) {
      return callback(err)
    }

    if ((start = stdout.match(new RegExp('-+BEGIN ' + searchStr + '-+$', 'mu')))) {
      start = start.index
    } else {
      start = -1
    }

    // To get the full EC key with parameters and private key
    if (searchStr === 'EC PARAMETERS') {
      searchStr = 'EC PRIVATE KEY'
    }

    if ((end = stdout.match(new RegExp('^\\-+END ' + searchStr + '\\-+', 'm')))) {
      end = end.index + end[0].length
    } else {
      end = -1
    }

    if (start >= 0 && end >= 0) {
      return callback(null, stdout.substring(start, end))
    } else {
      return callback(new Error(searchStr + ' not found from openssl output:\n---stdout---\n' + stdout + '\n---stderr---\n' + stderr + '\ncode: ' + code))
    }
  })
}

/**
 *  Spawn an openssl command and get binary output
 *
 * @static
 * @param {Array} params Array of openssl command line parameters
 * @param {Array} [tmpfiles] list of temporary files
 * @param {Function} callback Called with (error, stdout)
 */
function execBinary(params, tmpfiles, callback) {
  if (!callback && typeof tmpfiles === 'function') {
    callback = tmpfiles
    tmpfiles = false
  }
  spawnWrapper(params, tmpfiles, true, function (err, code, stdout, stderr) {
    debug("execBinary", {err, code, stdout, stderr})
    if (err) {
      return callback(err)
    }
    return callback(null, stdout)
  })
}

/**
 * Generically spawn openSSL, without processing the result
 *
 * @static
 * @param {Array}        params   The parameters to pass to openssl
 * @param {Boolean}      binary   Output of openssl is binary or text
 * @param {Function}     callback Called with (error, exitCode, stdout, stderr)
 */
function spawn(params, binary, callback) {
  var pathBin = get('pathOpenSSL') || process.env.OPENSSL_BIN || 'openssl'

  testOpenSSLPath(pathBin, function (err) {
    if (err) {
      return callback(err)
    }
    var openssl = cpspawn(pathBin, params)
    var stderr = ''

    var stdout = (binary ? Buffer.alloc(0) : '')
    openssl.stdout.on('data', function (data) {
      if (!binary) {
        stdout += data.toString('binary')
      } else {
        stdout = Buffer.concat([stdout, data])
      }
    })

    openssl.stderr.on('data', function (data) {
      stderr += data.toString('binary')
    })
    // We need both the return code and access to all of stdout.  Stdout isn't
    // *really* available until the close event fires; the timing nuance was
    // making this fail periodically.
    var needed = 2 // wait for both exit and close.
    var code = -1
    var finished = false
    var done = function (err) {
      if (finished) {
        return
      }

      if (err) {
        finished = true
        return callback(err)
      }

      if (--needed < 1) {
        finished = true
        if (code !== 0) {
          if (code === 2 && (stderr === '' || /depth lookup: unable to/.test(stderr) || /depth lookup: self(-|\s)signed certificate/.test(stderr))) {
            return callback(null, code, stdout, stderr)
          }
          return callback(new Error('Invalid openssl exit code: ' + code + '\n% openssl ' + params.join(' ') + '\n' + stderr), code)
        } else {
          return callback(null, code, stdout, stderr)
        }
      }
    }

    openssl.on('error', done)

    openssl.on('exit', function (ret) {
      code = ret
      done()
    })

    openssl.on('close', function () {
      stdout = (binary ? stdout : Buffer.from(stdout, 'binary').toString('utf-8'))
      stderr = Buffer.from(stderr, 'binary').toString('utf-8')
      done()
    })
  })
}

/**
 * Wrapper for spawn method
 *
 * @static
 * @param {Array} params The parameters to pass to openssl
 * @param {Array} [tmpfiles] list of temporary files
 * @param {Boolean} [binary] Output of openssl is binary or text
 * @param {Function} callback Called with (error, exitCode, stdout, stderr)
 */
function spawnWrapper(params, tmpfiles, binary, callback) {
  if (!callback && typeof binary === 'function') {
    callback = binary
    binary = false
  }

  var files = []
  var delTempPWFiles = []

  if (tmpfiles) {
    tmpfiles = [].concat(tmpfiles)
    var fpath, i
    for (i = 0; i < params.length; i++) {
      if (params[i] === '--TMPFILE--') {
        fpath = pathlib.join(tempDir, crypto.randomBytes(20).toString('hex'))
        files.push({
          path: fpath,
          contents: tmpfiles.shift()
        })
        params[i] = fpath
        delTempPWFiles.push(fpath)
      }
    }
  }

  var file
  for (i = 0; i < files.length; i++) {
    file = files[i]
    fs.writeFileSync(file.path, file.contents)
  }

  spawn(params, binary, function (err, code, stdout, stderr) {
    helper.deleteTempFiles(delTempPWFiles, function (fsErr) {
      debug(params[0], {
        err: err,
        fsErr: fsErr,
        code: code,
        stdout: stdout,
        stderr: stderr
      })
      callback(err || fsErr, code, stdout, stderr)
    })
  })
}

/**
 * Validates the pathBin for the openssl command
 *
 * @private
 * @param {String} pathBin The path to OpenSSL Bin
 * @param {Function} callback Callback function with an error object
 */
function testOpenSSLPath(pathBin, callback) {
  which(pathBin, function (error) {
    if (error) {
      return callback(new Error('Could not find openssl on your system on this path: ' + pathBin))
    }
    callback()
  })
}

/* Once PEM is imported, the openSslVersion is set with this function. */
function setVersion() {
  var pathBin = get('pathOpenSSL') || process.env.OPENSSL_BIN || 'openssl'
  var output = spawnSync(pathBin, ['version'])
  var text = String(output.stdout) + '\n' + String(output.stderr) + '\n' + String(output.error)
  let version = versionRegEx.exec(text)
  if (version === null || version.length <= 7) return
  set('openSslVersion', (version[1]).toUpperCase())
  set('Vendor', (version[1]).toUpperCase())
  set('VendorVersion', version[2])
  set('VendorVersionMajorMinor', version[3])
  set('VendorVersionMajor', version[4])
  set('VendorVersionMinor', version[5])
  set('VendorVersionPatch', version[6])
  set('VendorVersionBuildChar', typeof version[7] === 'undefined' ? '' : version[7])
};

setVersion();

module.exports = {
  exec: exec,
  execBinary: execBinary,
  spawn: spawn,
  spawnWrapper: spawnWrapper,
  settings: settings,
  set: set,
  get: get
}


/***/ }),

/***/ 214:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


/**
 * pem module
 *
 * @module pem
 */
const {debug} = __nccwpck_require__(762)
const {promisify} = __nccwpck_require__(525)
var net = __nccwpck_require__(808)
var helper = __nccwpck_require__(649)
var openssl = __nccwpck_require__(702)
const hash_md5 = __nccwpck_require__(711)

module.exports.createPrivateKey = createPrivateKey
module.exports.createDhparam = createDhparam
module.exports.createEcparam = createEcparam
module.exports.createCSR = createCSR
module.exports.createCertificate = createCertificate
module.exports.readCertificateInfo = readCertificateInfo
module.exports.getPublicKey = getPublicKey
module.exports.getFingerprint = getFingerprint
module.exports.getModulus = getModulus
module.exports.getDhparamInfo = getDhparamInfo
module.exports.createPkcs12 = createPkcs12
module.exports.readPkcs12 = readPkcs12
module.exports.verifySigningChain = verifySigningChain
module.exports.checkCertificate = checkCertificate
module.exports.checkPkcs12 = checkPkcs12
module.exports.config = config

/**
 * quick access the convert module
 * @type {module:convert}
 */
module.exports.convert = __nccwpck_require__(254)

var KEY_START = '-----BEGIN PRIVATE KEY-----'
var KEY_END = '-----END PRIVATE KEY-----'
var RSA_KEY_START = '-----BEGIN RSA PRIVATE KEY-----'
var RSA_KEY_END = '-----END RSA PRIVATE KEY-----'
var ENCRYPTED_KEY_START = '-----BEGIN ENCRYPTED PRIVATE KEY-----'
var ENCRYPTED_KEY_END = '-----END ENCRYPTED PRIVATE KEY-----'
var CERT_START = '-----BEGIN CERTIFICATE-----'
var CERT_END = '-----END CERTIFICATE-----'

/**
 * Creates a private key
 *
 * @static
 * @param {Number} [keyBitsize=2048] Size of the key, defaults to 2048bit
 * @param {Object} [options] object of cipher and password {cipher:'aes128',password:'xxx'}, defaults empty object
 * @param {String} [options.cipher] string of the cipher for the encryption - needed with password
 * @param {String} [options.password] string of the cipher password for the encryption needed with cipher
 * @param {Function} callback Callback function with an error object and {key}
 */
function createPrivateKey(keyBitsize, options, callback) {
  if (!callback && !options && typeof keyBitsize === 'function') {
    callback = keyBitsize
    keyBitsize = undefined
    options = {}
  } else if (!callback && keyBitsize && typeof options === 'function') {
    callback = options
    options = {}
  }

  keyBitsize = Number(keyBitsize) || 2048

  var params = ['genrsa']

  if (openssl.get('Vendor') === 'OPENSSL' && openssl.get('VendorVersionMajor') >= 3) {
    params.push('-traditional')
  }

  var delTempPWFiles = []

  if (options && options.cipher && (Number(helper.ciphers.indexOf(options.cipher)) !== -1) && options.password) {
    debug('helper.createPasswordFile', {
      cipher: options.cipher,
      password: options.password,
      passType: 'out'
    })
    helper.createPasswordFile({
      cipher: options.cipher,
      password: options.password,
      passType: 'out'
    }, params, delTempPWFiles)
  }

  params.push(keyBitsize)

  debug('version', openssl.get('openSslVersion'))

  openssl.exec(params, '(RSA |ENCRYPTED |)PRIVATE KEY', function (sslErr, key) {
    function done(err) {
      if (err) {
        return callback(err)
      }
      return callback(null, {
        key: key
      })
    }

    helper.deleteTempFiles(delTempPWFiles, function (fsErr) {
      debug('createPrivateKey', {
        sslErr: sslErr,
        fsErr: fsErr,
        key: key,
        keyLength: key && key.length
      })
      done(sslErr || fsErr)
    })
  })
}

/**
 * Creates a dhparam key
 *
 * @static
 * @param {Number} [keyBitsize=512] Size of the key, defaults to 512bit
 * @param {Function} callback Callback function with an error object and {dhparam}
 */
function createDhparam(keyBitsize, callback) {
  if (!callback && typeof keyBitsize === 'function') {
    callback = keyBitsize
    keyBitsize = undefined
  }

  keyBitsize = Number(keyBitsize) || 512

  var params = ['dhparam',
    '-outform',
    'PEM',
    keyBitsize
  ]

  openssl.exec(params, 'DH PARAMETERS', function (error, dhparam) {
    if (error) {
      return callback(error)
    }
    return callback(null, {
      dhparam: dhparam
    })
  })
}

/**
 * Creates a ecparam key
 * @static
 * @param {String} [keyName=secp256k1] Name of the key, defaults to secp256k1
 * @param {String} [paramEnc=explicit] Encoding of the elliptic curve parameters, defaults to explicit
 * @param {Boolean} [noOut=false] This option inhibits the output of the encoded version of the parameters.
 * @param {Function} callback Callback function with an error object and {ecparam}
 */
function createEcparam(keyName, paramEnc, noOut, callback) {
  if (!callback && typeof noOut === 'undefined' && !paramEnc && typeof keyName === 'function') {
    callback = keyName
    keyName = undefined
  } else if (!callback && typeof noOut === 'undefined' && keyName && typeof paramEnc === 'function') {
    callback = paramEnc
    paramEnc = undefined
  } else if (!callback && typeof noOut === 'function' && keyName && paramEnc) {
    callback = noOut
    noOut = undefined
  }

  keyName = keyName || 'secp256k1'
  paramEnc = paramEnc || 'explicit'
  noOut = noOut || false

  var params = ['ecparam',
    '-name',
    keyName,
    '-genkey',
    '-param_enc',
    paramEnc
  ]

  var searchString = 'EC PARAMETERS'
  if (noOut) {
    params.push('-noout')
    searchString = 'EC PRIVATE KEY'
  }

  openssl.exec(params, searchString, function (error, ecparam) {
    if (error) {
      return callback(error)
    }
    return callback(null, {
      ecparam: ecparam
    })
  })
}

/**
 * Creates a Certificate Signing Request
 * If client key is undefined, a new key is created automatically. The used key is included
 * in the callback return as clientKey
 * @static
 * @param {Object} [options] Optional options object
 * @param {String} [options.clientKey] Optional client key to use
 * @param {Number} [options.keyBitsize] If clientKey is undefined, bit size to use for generating a new key (defaults to 2048)
 * @param {String} [options.hash] Hash function to use (either md5 sha1 or sha256, defaults to sha256)
 * @param {String} [options.country] CSR country field
 * @param {String} [options.state] CSR state field
 * @param {String} [options.locality] CSR locality field
 * @param {String} [options.organization] CSR organization field
 * @param {String} [options.organizationUnit] CSR organizational unit field
 * @param {String} [options.commonName='localhost'] CSR common name field
 * @param {String} [options.emailAddress] CSR email address field
 * @param {String} [options.csrConfigFile] CSR config file
 * @param {Array}  [options.altNames] is a list of subjectAltNames in the subjectAltName field
 * @param {Function} callback Callback function with an error object and {csr, clientKey}
 */
function createCSR(options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options
    options = undefined
  }

  let delTempPWFiles = []

  options = options || {}

  // http://stackoverflow.com/questions/14089872/why-does-node-js-accept-ip-addresses-in-certificates-only-for-san-not-for-cn
  if (options.commonName && (net.isIPv4(options.commonName) || net.isIPv6(options.commonName))) {
    if (!options.altNames) {
      options.altNames = [options.commonName]
    } else if (options.altNames.indexOf(options.commonName) === -1) {
      options.altNames = options.altNames.concat([options.commonName])
    }
  }

  if (!options.clientKey) {
    if (options && (options.password || options.clientKeyPassword)) {
      options.password = options.password || options.clientKeyPassword || ''
    }
    createPrivateKey(options.keyBitsize || 2048, options, function (error, keyData) {
      if (error) {
        return callback(error)
      }
      options.clientKey = keyData.key

      createCSR(options, callback)
    })
    return
  }

  var params = ['req',
    '-new',
    '-' + (options.hash || 'sha256')
  ]

  if (options.csrConfigFile) {
    params.push('-config')
    params.push(options.csrConfigFile)
  } else {
    params.push('-subj')
    params.push(generateCSRSubject(options))
  }

  params.push('-key')
  params.push('--TMPFILE--')

  var tmpfiles = [options.clientKey]
  var config = null

  if (options && (options.password || options.clientKeyPassword)) {
    helper.createPasswordFile({
      cipher: '',
      password: options.password || options.clientKeyPassword,
      passType: 'in'
    }, params, delTempPWFiles)
  }

  if (options.altNames && Array.isArray(options.altNames) && options.altNames.length) {
    params.push('-extensions')
    params.push('v3_req')
    params.push('-config')
    params.push('--TMPFILE--')
    var altNamesRep = []
    for (var i = 0; i < options.altNames.length; i++) {
      altNamesRep.push((net.isIP(options.altNames[i]) ? 'IP' : 'DNS') + '.' + (i + 1) + ' = ' + options.altNames[i])
    }

    tmpfiles.push(config = [
      '[req]',
      'req_extensions = v3_req',
      'distinguished_name = req_distinguished_name',
      '[v3_req]',
      'subjectAltName = @alt_names',
      '[alt_names]',
      altNamesRep.join('\n'),
      '[req_distinguished_name]',
      'commonName = Common Name',
      'commonName_max = 64'
    ].join('\n'))
  } else if (options.config) {
    config = options.config
  }


  if (options.clientKeyPassword) {
    helper.createPasswordFile({
      cipher: '',
      password: options.clientKeyPassword,
      passType: 'in'
    }, params, delTempPWFiles)
  }

  openssl.exec(params, 'CERTIFICATE REQUEST', tmpfiles, function (sslErr, data) {
    function done(err) {
      if (err) {
        return callback(err)
      }
      callback(null, {
        csr: data,
        config: config,
        clientKey: options.clientKey
      })
    }

    helper.deleteTempFiles(delTempPWFiles, function (fsErr) {
      done(sslErr || fsErr)
    })
  })
}

/**
 * Creates a certificate based on a CSR. If CSR is not defined, a new one
 * will be generated automatically. For CSR generation all the options values
 * can be used as with createCSR.
 * @static
 * @param {Object} [options] Optional options object
 * @param {String} [options.serviceCertificate] PEM encoded certificate
 * @param {String} [options.serviceKey] Private key for signing the certificate, if not defined a new one is generated
 * @param {String} [options.serviceKeyPassword] Password of the service key
 * @param {Boolean} [options.selfSigned] If set to true and serviceKey is not defined, use clientKey for signing
 * @param {String|Number} [options.serial] Set a serial max. 20 octets - only together with options.serviceCertificate
 * @param {String} [options.serialFile] Set the name of the serial file, without extension. - only together with options.serviceCertificate and never in tandem with options.serial
 * @param {String} [options.hash] Hash function to use (either md5 sha1 or sha256, defaults to sha256)
 * @param {String} [options.csr] CSR for the certificate, if not defined a new one is generated
 * @param {Number} [options.days] Certificate expire time in days
 * @param {String} [options.clientKeyPassword] Password of the client key
 * @param {String} [options.extFile] extension config file - without '-extensions v3_req'
 * @param {String} [options.config] extension config file - with '-extensions v3_req'
 * @param {String} [options.csrConfigFile] CSR config file - only used if no options.csr is provided
 * @param {Array}  [options.altNames] is a list of subjectAltNames in the subjectAltName field - only used if no options.csr is provided
 * @param {Function} callback Callback function with an error object and {certificate, csr, clientKey, serviceKey}
 */
function createCertificate(options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options
    options = undefined
  }

  options = options || {}

  if (!options.csr) {
    createCSR(options, function (error, keyData) {
      if (error) {
        return callback(error)
      }
      options.csr = keyData.csr
      options.config = keyData.config
      options.clientKey = keyData.clientKey
      createCertificate(options, callback)
    })
    return
  }

  if (!options.clientKey) {
    options.clientKey = ''
  }

  if (!options.serviceKey) {
    if (options.selfSigned) {
      options.serviceKey = options.clientKey
    } else {
      createPrivateKey(options.keyBitsize || 2048, {
        cipher: options.cipher,
        password: options.clientKeyPassword || ''
      }, function (error, keyData) {
        if (error) {
          return callback(error)
        }
        options.serviceKey = keyData.key
        createCertificate(options, callback)
      })
      return
    }
  }

  readCertificateInfo(options.csr, function (error2, data2) {
    if (error2) {
      return callback(error2)
    }

    var params = ['x509',
      '-req',
      '-' + (options.hash || 'sha256'),
      '-days',
      Number(options.days) || '365',
      '-in',
      '--TMPFILE--'
    ]
    var tmpfiles = [options.csr]
    var delTempPWFiles = []

    if (options.serviceCertificate) {
      params.push('-CA')
      params.push('--TMPFILE--')
      params.push('-CAkey')
      params.push('--TMPFILE--')
      if (options.serial) {
        params.push('-set_serial')
        if (helper.isNumber(options.serial)) {
          // set the serial to the max lenth of 20 octets ()
          // A certificate serial number is not decimal conforming. That is the
          // bytes in a serial number do not necessarily map to a printable ASCII
          // character.
          // eg: 0x00 is a valid serial number and can not be represented in a
          // human readable format (atleast one that can be directly mapped to
          // the ACSII table).
          params.push('0x' + ('0000000000000000000000000000000000000000' + options.serial.toString(16)).slice(-40))
        } else {
          if (helper.isHex(options.serial)) {
            if (options.serial.startsWith('0x')) {
              options.serial = options.serial.substring(2, options.serial.length)
            }
            params.push('0x' + ('0000000000000000000000000000000000000000' + options.serial).slice(-40))
          } else {
            params.push('0x' + ('0000000000000000000000000000000000000000' + helper.toHex(options.serial)).slice(-40))
          }
        }
      } else {
        params.push('-CAcreateserial')
        if (options.serialFile) {
          params.push('-CAserial')
          params.push(options.serialFile + '.srl')
        }
      }
      if (options.serviceKeyPassword) {
        helper.createPasswordFile({
          cipher: '',
          password: options.serviceKeyPassword,
          passType: 'in'
        }, params, delTempPWFiles)
      }
      tmpfiles.push(options.serviceCertificate)
      tmpfiles.push(options.serviceKey)
    } else {
      params.push('-signkey')
      params.push('--TMPFILE--')
      if (options.serviceKeyPassword) {
        helper.createPasswordFile({
          cipher: '',
          password: options.serviceKeyPassword,
          passType: 'in'
        }, params, delTempPWFiles)
      }
      tmpfiles.push(options.serviceKey)
    }

    if (options.config) {
      params.push('-extensions')
      params.push('v3_req')
      params.push('-extfile')
      params.push('--TMPFILE--')
      tmpfiles.push(options.config)
    } else if (options.extFile) {
      params.push('-extfile')
      params.push(options.extFile)
    } else {
      var altNamesRep = []
      if (data2 && data2.san) {
        for (var i = 0; i < data2.san.dns.length; i++) {
          altNamesRep.push('DNS' + '.' + (i + 1) + ' = ' + data2.san.dns[i])
        }
        for (var i2 = 0; i2 < data2.san.ip.length; i2++) {
          altNamesRep.push('IP' + '.' + (i2 + 1) + ' = ' + data2.san.ip[i2])
        }
        for (var i3 = 0; i3 < data2.san.email.length; i3++) {
          altNamesRep.push('email' + '.' + (i3 + 1) + ' = ' + data2.san.email[i3])
        }
        params.push('-extensions')
        params.push('v3_req')
        params.push('-extfile')
        params.push('--TMPFILE--')
        tmpfiles.push([
          '[v3_req]',
          'subjectAltName = @alt_names',
          '[alt_names]',
          altNamesRep.join('\n')
        ].join('\n'))
      }
    }

    if (options.clientKeyPassword) {
      helper.createPasswordFile({
        cipher: '',
        password: options.clientKeyPassword,
        passType: 'in'
      }, params, delTempPWFiles)
    }

    openssl.exec(params, 'CERTIFICATE', tmpfiles, function (sslErr, data) {
      function done(err) {
        if (err) {
          return callback(err)
        }
        var response = {
          csr: options.csr,
          clientKey: options.clientKey,
          certificate: data,
          serviceKey: options.serviceKey
        }
        return callback(null, response)
      }

      helper.deleteTempFiles(delTempPWFiles, function (fsErr) {
        done(sslErr || fsErr)
      })
    })
  })
}

/**
 * Exports a public key from a private key, CSR or certificate
 * @static
 * @param {String} certificate PEM encoded private key, CSR or certificate
 * @param {Function} callback Callback function with an error object and {publicKey}
 */
function getPublicKey(certificate, callback) {
  if (!callback && typeof certificate === 'function') {
    callback = certificate
    certificate = undefined
  }

  certificate = (certificate || '').toString()

  var params

  if (certificate.match(/BEGIN(\sNEW)? CERTIFICATE REQUEST/)) {
    params = ['req',
      '-in',
      '--TMPFILE--',
      '-pubkey',
      '-noout'
    ]
  } else if (certificate.match(/BEGIN RSA PRIVATE KEY/) || certificate.match(/BEGIN PRIVATE KEY/)) {
    params = ['rsa',
      '-in',
      '--TMPFILE--',
      '-pubout'
    ]
  } else {
    params = ['x509',
      '-in',
      '--TMPFILE--',
      '-pubkey',
      '-noout'
    ]
  }

  openssl.exec(params, 'PUBLIC KEY', certificate, function (error, key) {
    if (error) {
      return callback(error)
    }
    return callback(null, {
      publicKey: key
    })
  })
}

/**
 * Reads subject data from a certificate or a CSR
 * @static
 * @param {String} certificate PEM encoded CSR or certificate
 * @param {Function} callback Callback function with an error object and {country, state, locality, organization, organizationUnit, commonName, emailAddress}
 */
function readCertificateInfo(certificate, callback) {
  if (!callback && typeof certificate === 'function') {
    callback = certificate
    certificate = undefined
  }

  certificate = (certificate || '').toString()
  var isMatch = certificate.match(/BEGIN(\sNEW)? CERTIFICATE REQUEST/)
  var type = isMatch ? 'req' : 'x509'
  var params = [type,
    '-noout',
    '-nameopt',
    'RFC2253,sep_multiline,space_eq,-esc_msb,utf8',
    '-text',
    '-in',
    '--TMPFILE--'
  ]
  openssl.spawnWrapper(params, certificate, function (err, code, stdout, stderr) {
    if (err) {
      return callback(err)
    } else if (stderr) {
      return callback(stderr)
    }
    return fetchCertificateData(stdout, callback)
  })
}

/**
 * get the modulus from a certificate, a CSR or a private key
 * @static
 * @param {String} certificate PEM encoded, CSR PEM encoded, or private key
 * @param {String} [password] password for the certificate
 * @param {String} [hash] hash function to use (up to now `md5` supported) (default: none)
 * @param {Function} callback Callback function with an error object and {modulus}
 */
function getModulus(certificate, password, hash, callback) {
  if (!callback && !hash && typeof password === 'function') {
    callback = password
    password = undefined
    hash = false
  } else if (!callback && hash && typeof hash === 'function') {
    callback = hash
    hash = false
    // password will be falsy if not provided
  }
  // adding hash function to params, is not supported by openssl.
  // process piping would be the right way (... | openssl md5)
  // No idea how this can be achieved in easy with the current build in methods
  // of pem.
  if (hash && hash !== 'md5') {
    hash = false
  }

  certificate = (Buffer.isBuffer(certificate) && certificate.toString()) || certificate

  let type
  if (certificate.match(/BEGIN(\sNEW)? CERTIFICATE REQUEST/)) {
    type = 'req'
  } else if (certificate.match(/BEGIN RSA PRIVATE KEY/) || certificate.match(/BEGIN PRIVATE KEY/)) {
    type = 'rsa'
  } else {
    type = 'x509'
  }
  let params = [
    type,
    '-noout',
    '-modulus',
    '-in',
    '--TMPFILE--'
  ]
  let delTempPWFiles = []
  if (password) {
    helper.createPasswordFile({cipher: '', password: password, passType: 'in'}, params, delTempPWFiles)
  }

  openssl.spawnWrapper(params, certificate, function (sslErr, code, stdout, stderr) {
    function done(err) {
      if (err) {
        return callback(err)
      }
      var match = stdout.match(/Modulus=([0-9a-fA-F]+)$/m)
      if (match) {
        if (hash === 'md5') {
          return callback(null, {
            modulus: hash_md5(match[1])
          })
        }

        return callback(null, {
          modulus: match[1]
        })

      } else {
        return callback(new Error('No modulus'))
      }
    }

    helper.deleteTempFiles(delTempPWFiles, function (fsErr) {
      done(sslErr || fsErr || stderr)
    })
  })
}

/**
 * get the size and prime of DH parameters
 * @static
 * @param {String} dh parameters PEM encoded
 * @param {Function} callback Callback function with an error object and {size, prime}
 */
function getDhparamInfo(dh, callback) {
  dh = (Buffer.isBuffer(dh) && dh.toString()) || dh

  var params = [
    'dhparam',
    '-text',
    '-in',
    '--TMPFILE--'
  ]

  openssl.spawnWrapper(params, dh, function (err, code, stdout, stderr) {
    if (err) {
      return callback(err)
    } else if (stderr) {
      return callback(stderr)
    }

    var result = {}
    var match = stdout.match(/Parameters: \((\d+) bit\)/)

    if (match) {
      result.size = Number(match[1])
    }

    var prime = ''
    stdout.split('\n').forEach(function (line) {
      if (/\s+([0-9a-f][0-9a-f]:)+[0-9a-f]?[0-9a-f]?/g.test(line)) {
        prime += line.trim()
      }
    })

    if (prime) {
      result.prime = prime
    }

    if (!match && !prime) {
      return callback(new Error('No DH info found'))
    }

    return callback(null, result)
  })
}

/**
 * config the pem module
 * @static
 * @param {Object} options
 */
function config(options) {
  Object.keys(options).forEach(function (k) {
    openssl.set(k, options[k])
  })
}

/**
 * Gets the fingerprint for a certificate
 * @static
 * @param {String} certificate PEM encoded certificate
 * @param {String} [hash] hash function to use (either `md5`, `sha1` or `sha256`, defaults to `sha1`)
 * @param {Function} callback Callback function with an error object and {fingerprint}
 */
function getFingerprint(certificate, hash, callback) {
  if (!callback && typeof hash === 'function') {
    callback = hash
    hash = undefined
  }

  hash = hash || 'sha1'

  var params = ['x509',
    '-in',
    '--TMPFILE--',
    '-fingerprint',
    '-noout',
    '-' + hash
  ]

  openssl.spawnWrapper(params, certificate, function (err, code, stdout, stderr) {
    if (err) {
      return callback(err)
    } else if (stderr) {
      return callback(stderr)
    }
    var match = stdout.match(/Fingerprint=([0-9a-fA-F:]+)$/m)
    if (match) {
      return callback(null, {
        fingerprint: match[1]
      })
    } else {
      return callback(new Error('No fingerprint'))
    }
  })
}

/**
 * Export private key and certificate to a PKCS12 keystore
 * @static
 * @param {String} key PEM encoded private key
 * @param {String} certificate PEM encoded certificate
 * @param {String} password Password of the result PKCS12 file
 * @param {Object} [options] object of cipher and optional client key password {cipher:'aes128', clientKeyPassword: 'xxxx', certFiles: ['file1','file2']}
 * @param {Function} callback Callback function with an error object and {pkcs12}
 */
function createPkcs12(key, certificate, password, options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options
    options = {}
  }

  var params = ['pkcs12', '-export']
  var delTempPWFiles = []

  if (options.cipher && options.clientKeyPassword) {
    // NOTICE: The password field is needed! self if it is empty.
    // create password file for the import "-passin"
    helper.createPasswordFile({
      cipher: options.cipher,
      password: options.clientKeyPassword,
      passType: 'in'
    }, params, delTempPWFiles)
  }
  // NOTICE: The password field is needed! self if it is empty.
  // create password file for the password "-password"
  helper.createPasswordFile({cipher: '', password: password, passType: 'word'}, params, delTempPWFiles)

  params.push('-in')
  params.push('--TMPFILE--')
  params.push('-inkey')
  params.push('--TMPFILE--')

  var tmpfiles = [certificate, key]

  if (options.certFiles) {
    tmpfiles.push(options.certFiles.join(''))

    params.push('-certfile')
    params.push('--TMPFILE--')
  }

  openssl.execBinary(params, tmpfiles, function (sslErr, pkcs12) {
    function done(err) {
      if (err) {
        return callback(err)
      }
      return callback(null, {
        pkcs12: pkcs12
      })
    }

    helper.deleteTempFiles(delTempPWFiles, function (fsErr) {
      done(sslErr || fsErr)
    })
  })
}

/**
 * read sslcert data from Pkcs12 file. Results are provided in callback response in object notation ({cert: .., ca:..., key:...})
 * @static
 * @param  {Buffer|String}   bufferOrPath Buffer or path to file
 * @param  {Object}   [options]      openssl options
 * @param  {Function} callback     Called with error object and sslcert bundle object
 */
function readPkcs12(bufferOrPath, options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options
    options = {}
  }

  options.p12Password = options.p12Password || ''

  var tmpfiles = []
  var delTempPWFiles = []
  var args = ['pkcs12', '-in', bufferOrPath]

  helper.createPasswordFile({cipher: '', password: options.p12Password, passType: 'in'}, args, delTempPWFiles)

  if (Buffer.isBuffer(bufferOrPath)) {
    tmpfiles = [bufferOrPath]
    args[2] = '--TMPFILE--'
  }

  if (openssl.get('Vendor') === "OPENSSL" && openssl.get('VendorVersionMajor') >= 3) {
    args.push('-legacy')
    args.push('-traditional')
  }

  if (options.clientKeyPassword) {
    helper.createPasswordFile({
      cipher: '',
      password: options.clientKeyPassword,
      passType: 'out'
    }, args, delTempPWFiles)
  } else {
    args.push('-nodes')
  }

  openssl.execBinary(args, tmpfiles, function (sslErr, stdout) {
    function done(err) {
      var keybundle = {}

      if (err && err.message.indexOf('No such file or directory') !== -1) {
        err.code = 'ENOENT'
      }

      if (!err) {
        var certs = readFromString(stdout, CERT_START, CERT_END)
        keybundle.cert = certs.shift()
        keybundle.ca = certs
        keybundle.key = readFromString(stdout, KEY_START, KEY_END).pop()

        debug("readPkcs12.execBinary - PRIVATE KEY - ?: ", keybundle.key)
        if (keybundle.key) {
          var args = ['rsa'];
          if (openssl.get('Vendor') === "OPENSSL" && openssl.get('VendorVersionMajor') >= 3) {
            args.push('-traditional')
          }
          args.push('-in');
          args.push('--TMPFILE--');

          // convert to RSA key
          return openssl.exec(args, '(RSA |)PRIVATE KEY', [keybundle.key], function (err, key) {
            if (err) {
              debug("readPkcs12.execBinary - PRIVATE KEY convert - error: ", err)
            }
            //debug("readPkcs12.execBinary - PRIVATE KEY", key)
            keybundle.key = key

            return callback(err, keybundle)
          })
        }

        if (options.clientKeyPassword) {
          keybundle.key = readFromString(stdout, ENCRYPTED_KEY_START, ENCRYPTED_KEY_END).pop()
          debug("readPkcs12.execBinary - ENCRYPTED PRIVATE KEY - ?: ", keybundle.key)
          /*return openssl.exec(['rsa', '-in', '--TMPFILE--'], 'RSA PRIVATE KEY', [keybundle.key], function (err, key) {
            if (err) {
              debug("readPkcs12.execBinary - ENCRYPTED PRIVATE KEY - error: ", err)
            }
            debug("readPkcs12.execBinary - ENCRYPTED PRIVATE KEY", key)
            keybundle.key = key

            return callback(err, keybundle)
          })*/
        } else {
          keybundle.key = readFromString(stdout, RSA_KEY_START, RSA_KEY_END).pop()
          debug("readPkcs12.execBinary - RSA PRIVATE KEY - ?: ", keybundle.key)
          /*return openssl.exec(['rsa', '-in', '--TMPFILE--'], 'RSA PRIVATE KEY', [keybundle.key], function (err, key) {
            if (err) {
              debug("readPkcs12.execBinary - RSA PRIVATE KEY - error: ", err)
            }
            debug("readPkcs12.execBinary - RSA PRIVATE KEY", key)
            keybundle.key = key

            return callback(err, keybundle)
          })*/
        }
      }

      return callback(err, keybundle)
    }

    helper.deleteTempFiles(delTempPWFiles, function (fsErr) {
      done(sslErr || fsErr)
    })
  })
}

/**
 * Check a certificate
 * @static
 * @param {String} certificate PEM encoded certificate
 * @param {String} [passphrase] password for the certificate
 * @param {Function} callback Callback function with an error object and a boolean valid
 */
function checkCertificate(certificate, passphrase, callback) {
  var params
  var delTempPWFiles = []

  if (!callback && typeof passphrase === 'function') {
    callback = passphrase
    passphrase = undefined
  }
  certificate = (certificate || '').toString()

  if (certificate.match(/BEGIN(\sNEW)? CERTIFICATE REQUEST/)) {
    params = ['req', '-text', '-noout', '-verify', '-in', '--TMPFILE--']
  } else if (certificate.match(/BEGIN RSA PRIVATE KEY/) || certificate.match(/BEGIN PRIVATE KEY/)) {
    params = ['rsa', '-noout', '-check', '-in', '--TMPFILE--']
  } else {
    params = ['x509', '-text', '-noout', '-in', '--TMPFILE--']
  }
  if (passphrase) {
    helper.createPasswordFile({cipher: '', password: passphrase, passType: 'in'}, params, delTempPWFiles)
  }

  openssl.spawnWrapper(params, certificate, function (sslErr, code, stdout, stderr) {
    function done(err) {

      stdout = stdout && stdout.trim()
      var result
      switch (params[0]) {
        case 'rsa':
          result = /^Rsa key ok$/i.test(stdout)
          break
        default:
          result = /Signature Algorithm/im.test(stdout)
          break
      }
      if (!result) {
        if (openssl.get('Vendor') === "OPENSSL" && openssl.get('VendorVersionMajor') >= 3) {
          if (!(stderr && stderr.toString().trim().endsWith('verify OK'))) {
            return callback(new Error(stderr.toString()))
          }
        }
        if (err && err.toString().trim() !== 'verify OK') {
          return callback(err)
        }
      }
      callback(null, result)
    }

    helper.deleteTempFiles(delTempPWFiles, function (fsErr) {
      done(sslErr || fsErr || stderr)
    })
  })
}

/**
 * check a PKCS#12 file (.pfx or.p12)
 * @static
 * @param {Buffer|String} bufferOrPath PKCS#12 certificate
 * @param {String} [passphrase] optional passphrase which will be used to open the keystore
 * @param {Function} callback Callback function with an error object and a boolean valid
 */
function checkPkcs12(bufferOrPath, passphrase, callback) {
  if (!callback && typeof passphrase === 'function') {
    callback = passphrase
    passphrase = ''
  }

  var tmpfiles = []
  var delTempPWFiles = []
  var args = ['pkcs12', '-info', '-in', bufferOrPath, '-noout', '-maciter', '-nodes']

  helper.createPasswordFile({cipher: '', password: passphrase, passType: 'in'}, args, delTempPWFiles)

  if (Buffer.isBuffer(bufferOrPath)) {
    tmpfiles = [bufferOrPath]
    args[3] = '--TMPFILE--'
  }

  if (openssl.get('Vendor') === "OPENSSL" && openssl.get('VendorVersionMajor') >= 3) {
    args.splice(2, 0, '-legacy');
  }

  openssl.spawnWrapper(args, tmpfiles, function (sslErr, code, stdout, stderr) {
    debug('checkPkcs12 error', {
      err: sslErr,
      code: code,
      stdout: stdout,
      stdoutResult: (/MAC verified OK/im.test(stderr) || (!(/MAC verified OK/im.test(stderr)) && !(/Mac verify error/im.test(stderr)))),
      stderr: stderr
    })

    function done(err) {
      if (err) {
        return callback(err)
      }
      callback(null, (/MAC verified OK/im.test(stderr) || (!(/MAC verified OK/im.test(stderr)) && !(/Mac verify error/im.test(stderr)))))
    }

    helper.deleteTempFiles(delTempPWFiles, function (fsErr) {
      debug('checkPkcs12 clean-up error', {
        sslErr: sslErr,
        fsErr: fsErr,
        code: code,
        stdout: stdout,
        stdoutResult: (/MAC verified OK/im.test(stderr) || (!(/MAC verified OK/im.test(stderr)) && !(/Mac verify error/im.test(stderr)))),
        stderr: stderr
      })
      done(sslErr || fsErr)
    })
  })
}

/**
 * Verifies the signing chain of the passed certificate
 * @static
 * @param {String|Array} certificate PEM encoded certificate include intermediate certificates
 * The correct order of trust chain must be preserved and should start with Leaf
 * certificate. Example array: [Leaf, Int CA 1, ... , Int CA N, Root CA].
 * @param {String|Array} ca [List] of CA certificates
 * @param {Function} callback Callback function with an error object and a boolean valid
 */
function verifySigningChain(certificate, ca, callback) {
  if (!callback && typeof ca === 'function') {
    callback = ca
    ca = undefined
  }
  if (!Array.isArray(certificate)) {
    certificate = readFromString(certificate, CERT_START, CERT_END)
  }
  if (!Array.isArray(ca) && ca !== undefined) {
    if (ca !== '') {
      ca = [ca]
    }
  }

  var params = ['verify']
  var files = []

  if (ca !== undefined) {
    // ca certificates
    params.push('-CAfile')
    params.push('--TMPFILE--')
    files.push(ca.join('\n'))
  }
  // extracting the very first - leaf - cert in chain
  var leaf = certificate.shift()

  if (certificate.length > 0) {
    params.push('-untrusted')
    params.push('--TMPFILE--')
    files.push(certificate.join('\n'))
  }

  params.push('--TMPFILE--')
  files.push(leaf)

  openssl.spawnWrapper(params, files, function (err, code, stdout, stderr) {
    // OPENSSL 3.x don't use stdout to print the error
    debug('Vendor', openssl.get('Vendor'))
    debug('VendorVersionMajor', openssl.get('VendorVersionMajor'))
    debug('openssl.get(\'VendorVersionMajor\') >= 3', openssl.get('VendorVersionMajor') >= 3)

    if (openssl.get('Vendor') === "OPENSSL" && openssl.get('VendorVersionMajor') >= 3) {
      let openssl30Check = !!(stdout && stdout.trim().includes(": OK"));

      if (err) {
        debug('verifySigningChain error', {
          err: err,
          code: code,
          stdout: stdout,
          stdoutResult: openssl30Check,
          stderr: stderr
        })
        return callback(err)
      }

      debug('verifySigningChain error - use stderr', {
        err: err,
        code: code,
        stdout: stdout.trim(),
        stdoutResult: openssl30Check,
        stderr: stderr.trim()
      })
      return callback(null, openssl30Check)
    }
    // END: OPENSSL 3.x don't use stdout to print the error
    if (err) {
      debug('verifySigningChain error', {
        err: err,
        code: code,
        stdout: stdout,
        stdoutResult: stdout && stdout.trim().slice(-4) === ': OK',
        stderr: stderr
      })
      return callback(err)
    }
    debug('verifySigningChain', {
      err: err,
      code: code,
      stdout: stdout,
      stdoutResult: stdout && stdout.trim().slice(-4) === ': OK',
      stderr: stderr
    })
    callback(null, stdout && stdout.trim().slice(-4) === ': OK')
  })
}

// HELPER FUNCTIONS
function fetchCertificateData(certData, callback) {
  // try catch : if something will fail in parsing it won't crash the calling code
  try {
    certData = (certData || '').toString()

    var serial, subject, tmp, issuer
    var certValues = {
      issuer: {}
    }
    var validity = {}
    var san

    var ky, i

    // serial
    if ((serial = certData.match(/\s*Serial Number:\r?\n?\s*([^\r\n]*)\r?\n\s*\b/)) && serial.length > 1) {
      certValues.serial = serial[1]
    }

    if ((subject = certData.match(/\s*Subject:\r?\n(\s*(([a-zA-Z0-9.]+)\s=\s[^\r\n]+\r?\n))*\s*\b/)) && subject.length > 1) {
      subject = subject[0]
      tmp = matchAll(subject, /\s([a-zA-Z0-9.]+)\s=\s([^\r\n].*)/g)
      if (tmp) {
        for (i = 0; i < tmp.length; i++) {
          ky = tmp[i][1].trim()
          if (ky.match('(C|ST|L|O|OU|CN|emailAddress|DC)') || ky === '') {
            continue
          }
          certValues[ky] = tmp[i][2].trim()
        }
      }

      // country
      tmp = subject.match(/\sC\s=\s([^\r\n].*?)[\r\n]/)
      certValues.country = (tmp && tmp[1]) || ''

      // state
      tmp = subject.match(/\sST\s=\s([^\r\n].*?)[\r\n]/)
      certValues.state = (tmp && tmp[1]) || ''

      // locality
      tmp = subject.match(/\sL\s=\s([^\r\n].*?)[\r\n]/)
      certValues.locality = (tmp && tmp[1]) || ''

      // organization
      tmp = matchAll(subject, /\sO\s=\s([^\r\n].*)/g)
      certValues.organization = tmp ? (tmp.length > 1 ? tmp.sort(function (t, n) {
        var e = t[1].toUpperCase()
        var r = n[1].toUpperCase()
        return r > e ? -1 : e > r ? 1 : 0
      }).sort(function (t, n) {
        return t[1].length - n[1].length
      }).map(function (t) {
        return t[1]
      }) : tmp[0][1]) : ''

      // unit
      tmp = matchAll(subject, /\sOU\s=\s([^\r\n].*)/g)
      certValues.organizationUnit = tmp ? (tmp.length > 1 ? tmp.sort(function (t, n) {
        var e = t[1].toUpperCase()
        var r = n[1].toUpperCase()
        return r > e ? -1 : e > r ? 1 : 0
      }).sort(function (t, n) {
        return t[1].length - n[1].length
      }).map(function (t) {
        return t[1]
      }) : tmp[0][1]) : ''

      // common name
      tmp = matchAll(subject, /\sCN\s=\s([^\r\n].*)/g)
      certValues.commonName = tmp ? (tmp.length > 1 ? tmp.sort(function (t, n) {
        var e = t[1].toUpperCase()
        var r = n[1].toUpperCase()
        return r > e ? -1 : e > r ? 1 : 0
      }).sort(function (t, n) {
        return t[1].length - n[1].length
      }).map(function (t) {
        return t[1]
      }) : tmp[0][1]) : ''

      // email
      tmp = matchAll(subject, /emailAddress\s=\s([^\r\n].*)/g)
      certValues.emailAddress = tmp ? (tmp.length > 1 ? tmp.sort(function (t, n) {
        var e = t[1].toUpperCase()
        var r = n[1].toUpperCase()
        return r > e ? -1 : e > r ? 1 : 0
      }).sort(function (t, n) {
        return t[1].length - n[1].length
      }).map(function (t) {
        return t[1]
      }) : tmp[0][1]) : ''

      // DC name
      tmp = matchAll(subject, /\sDC\s=\s([^\r\n].*)/g)
      certValues.dc = tmp ? (tmp.length > 1 ? tmp.sort(function (t, n) {
        var e = t[1].toUpperCase()
        var r = n[1].toUpperCase()
        return r > e ? -1 : e > r ? 1 : 0
      }).sort(function (t, n) {
        return t[1].length - n[1].length
      }).map(function (t) {
        return t[1]
      }) : tmp[0][1]) : ''
    }

    if ((issuer = certData.match(/\s*Issuer:\r?\n(\s*([a-zA-Z0-9.]+)\s=\s[^\r\n].*\r?\n)*\s*\b/)) && issuer.length > 1) {
      issuer = issuer[0]
      tmp = matchAll(issuer, /\s([a-zA-Z0-9.]+)\s=\s([^\r\n].*)/g)
      for (i = 0; i < tmp.length; i++) {
        ky = tmp[i][1].toString()
        if (ky.match('(C|ST|L|O|OU|CN|emailAddress|DC)')) {
          continue
        }
        certValues.issuer[ky] = tmp[i][2].toString()
      }

      // country
      tmp = issuer.match(/\sC\s=\s([^\r\n].*?)[\r\n]/)
      certValues.issuer.country = (tmp && tmp[1]) || ''

      // state
      tmp = issuer.match(/\sST\s=\s([^\r\n].*?)[\r\n]/)
      certValues.issuer.state = (tmp && tmp[1]) || ''

      // locality
      tmp = issuer.match(/\sL\s=\s([^\r\n].*?)[\r\n]/)
      certValues.issuer.locality = (tmp && tmp[1]) || ''

      // organization
      tmp = matchAll(issuer, /\sO\s=\s([^\r\n].*)/g)
      certValues.issuer.organization = tmp ? (tmp.length > 1 ? tmp.sort(function (t, n) {
        var e = t[1].toUpperCase()
        var r = n[1].toUpperCase()
        return r > e ? -1 : e > r ? 1 : 0
      }).sort(function (t, n) {
        return t[1].length - n[1].length
      }).map(function (t) {
        return t[1]
      }) : tmp[0][1]) : ''

      // unit
      tmp = matchAll(issuer, /\sOU\s=\s([^\r\n].*)/g)
      certValues.issuer.organizationUnit = tmp ? (tmp.length > 1 ? tmp.sort(function (t, n) {
        var e = t[1].toUpperCase()
        var
          r = n[1].toUpperCase()
        return r > e ? -1 : e > r ? 1 : 0
      }).sort(function (t, n) {
        return t[1].length - n[1].length
      }).map(function (t) {
        return t[1]
      }) : tmp[0][1]) : ''

      // common name
      tmp = matchAll(issuer, /\sCN\s=\s([^\r\n].*)/g)
      certValues.issuer.commonName = tmp ? (tmp.length > 1 ? tmp.sort(function (t, n) {
        var e = t[1].toUpperCase()
        var
          r = n[1].toUpperCase()
        return r > e ? -1 : e > r ? 1 : 0
      }).sort(function (t, n) {
        return t[1].length - n[1].length
      }).map(function (t) {
        return t[1]
      }) : tmp[0][1]) : ''

      // DC name
      tmp = matchAll(issuer, /\sDC\s=\s([^\r\n].*)/g)
      certValues.issuer.dc = tmp ? (tmp.length > 1 ? tmp.sort(function (t, n) {
        var e = t[1].toUpperCase()
        var
          r = n[1].toUpperCase()
        return r > e ? -1 : e > r ? 1 : 0
      }).sort(function (t, n) {
        return t[1].length - n[1].length
      }).map(function (t) {
        return t[1]
      }) : tmp[0][1]) : ''
    }

    // SAN
    if ((san = certData.match(/X509v3 Subject Alternative Name: \r?\n([^\r\n]*)\r?\n/)) && san.length > 1) {
      san = san[1].trim() + '\n'
      certValues.san = {}

      // hostnames
      tmp = pregMatchAll('DNS:([^,\\r\\n].*?)[,\\r\\n\\s]', san)
      certValues.san.dns = tmp || ''

      // IP-Addresses IPv4 & IPv6
      tmp = pregMatchAll('IP Address:([^,\\r\\n].*?)[,\\r\\n\\s]', san)
      certValues.san.ip = tmp || ''

      // Email Addresses
      tmp = pregMatchAll('email:([^,\\r\\n].*?)[,\\r\\n\\s]', san)
      certValues.san.email = tmp || ''
    }

    // Validity
    if ((tmp = certData.match(/Not Before\s?:\s?([^\r\n]*)\r?\n/)) && tmp.length > 1) {
      validity.start = Date.parse((tmp && tmp[1]) || '')
    }

    if ((tmp = certData.match(/Not After\s?:\s?([^\r\n]*)\r?\n/)) && tmp.length > 1) {
      validity.end = Date.parse((tmp && tmp[1]) || '')
    }

    if (validity.start && validity.end) {
      certValues.validity = validity
    }
    // Validity end

    // Signature Algorithm
    if ((tmp = certData.match(/Signature Algorithm: ([^\r\n]*)\r?\n/)) && tmp.length > 1) {
      certValues.signatureAlgorithm = (tmp && tmp[1]) || ''
    }

    // Public Key
    if ((tmp = certData.match(/Public[ -]Key: ([^\r\n]*)\r?\n/)) && tmp.length > 1) {
      certValues.publicKeySize = ((tmp && tmp[1]) || '').replace(/[()]/g, '')
    }

    // Public Key Algorithm
    if ((tmp = certData.match(/Public Key Algorithm: ([^\r\n]*)\r?\n/)) && tmp.length > 1) {
      certValues.publicKeyAlgorithm = (tmp && tmp[1]) || ''
    }

    callback(null, certValues)
  } catch (err) {
    callback(err)
  }
}

function matchAll(str, regexp) {
  var matches = []
  str.replace(regexp, function () {
    var arr = ([]).slice.call(arguments, 0)
    var extras = arr.splice(-2)
    arr.index = extras[0]
    arr.input = extras[1]
    matches.push(arr)
  })
  return matches.length ? matches : null
}

function pregMatchAll(regex, haystack) {
  var globalRegex = new RegExp(regex, 'g')
  var globalMatch = haystack.match(globalRegex) || []
  var matchArray = []
  var nonGlobalRegex, nonGlobalMatch
  for (var i = 0; i < globalMatch.length; i++) {
    nonGlobalRegex = new RegExp(regex)
    nonGlobalMatch = globalMatch[i].match(nonGlobalRegex)
    matchArray.push(nonGlobalMatch[1])
  }
  return matchArray
}

function generateCSRSubject(options) {
  options = options || {}

  var csrData = {
    C: options.country || options.C,
    ST: options.state || options.ST,
    L: options.locality || options.L,
    O: options.organization || options.O,
    OU: options.organizationUnit || options.OU,
    CN: options.commonName || options.CN || 'localhost',
    DC: options.dc || options.DC || '',
    emailAddress: options.emailAddress
  }

  var csrBuilder = Object.keys(csrData).map(function (key) {
    if (csrData[key]) {
      if (typeof csrData[key] === 'object' && csrData[key].length >= 1) {
        var tmpStr = ''
        csrData[key].map(function (o) {
          tmpStr += '/' + key + '=' + o.replace(/[^\w\s-!$%^&*()_+|~=`{}[\]:/;<>?,.@#]+/g, ' ').replace('/', '\\/').replace('+', '\\+').trim()
        })
        return tmpStr
      } else {
        return '/' + key + '=' + csrData[key].replace(/[^\w\s-!$%^&*()_+|~=`{}[\]:/;<>?,.@#]+/g, ' ').replace('/', '\\/').replace('+', '\\+').trim()
      }
    }
  })

  return csrBuilder.join('')
}

function readFromString(string, start, end) {
  if (Buffer.isBuffer(string)) {
    string = string.toString('utf8')
  }

  var output = []

  if (!string) {
    return output
  }

  var offset = string.indexOf(start)

  while (offset !== -1) {
    string = string.substring(offset)

    var endOffset = string.indexOf(end)

    if (endOffset === -1) {
      break
    }

    endOffset += end.length

    output.push(string.substring(0, endOffset))
    offset = string.indexOf(start, endOffset)
  }

  return output
}

// promisify not tested yet
/**
 * Verifies the signing chain of the passed certificate
 * @namespace
 * @name promisified
 * @property {function}  createPrivateKey               @see createPrivateKey
 * @property {function}  createDhparam       - The default number of players.
 * @property {function}  createEcparam         - The default level for the party.
 * @property {function}  createCSR      - The default treasure.
 * @property {function}  createCertificate - How much gold the party starts with.
 */
module.exports.promisified = {
  createPrivateKey: promisify(createPrivateKey),
  createDhparam: promisify(createDhparam),
  createEcparam: promisify(createEcparam),
  createCSR: promisify(createCSR),
  createCertificate: promisify(createCertificate),
  readCertificateInfo: promisify(readCertificateInfo),
  getPublicKey: promisify(getPublicKey),
  getFingerprint: promisify(getFingerprint),
  getModulus: promisify(getModulus),
  getDhparamInfo: promisify(getDhparamInfo),
  createPkcs12: promisify(createPkcs12),
  readPkcs12: promisify(readPkcs12),
  verifySigningChain: promisify(verifySigningChain),
  checkCertificate: promisify(checkCertificate),
  checkPkcs12: promisify(checkPkcs12)
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module used 'module' so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(214);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map