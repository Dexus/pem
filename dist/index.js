require('./sourcemap-register.js');(()=>{var e={126:(e,t,r)=>{var n=r(147);var s;if(process.platform==="win32"||global.TESTING_WINDOWS){s=r(1)}else{s=r(728)}e.exports=isexe;isexe.sync=sync;function isexe(e,t,r){if(typeof t==="function"){r=t;t={}}if(!r){if(typeof Promise!=="function"){throw new TypeError("callback not provided")}return new Promise((function(r,n){isexe(e,t||{},(function(e,t){if(e){n(e)}else{r(t)}}))}))}s(e,t||{},(function(e,n){if(e){if(e.code==="EACCES"||t&&t.ignoreErrors){e=null;n=false}}r(e,n)}))}function sync(e,t){try{return s.sync(e,t||{})}catch(e){if(t&&t.ignoreErrors||e.code==="EACCES"){return false}else{throw e}}}},728:(e,t,r)=>{e.exports=isexe;isexe.sync=sync;var n=r(147);function isexe(e,t,r){n.stat(e,(function(e,n){r(e,e?false:checkStat(n,t))}))}function sync(e,t){return checkStat(n.statSync(e),t)}function checkStat(e,t){return e.isFile()&&checkMode(e,t)}function checkMode(e,t){var r=e.mode;var n=e.uid;var s=e.gid;var o=t.uid!==undefined?t.uid:process.getuid&&process.getuid();var i=t.gid!==undefined?t.gid:process.getgid&&process.getgid();var c=parseInt("100",8);var a=parseInt("010",8);var u=parseInt("001",8);var f=c|a;var p=r&u||r&a&&s===i||r&c&&n===o||r&f&&o===0;return p}},1:(e,t,r)=>{e.exports=isexe;isexe.sync=sync;var n=r(147);function checkPathExt(e,t){var r=t.pathExt!==undefined?t.pathExt:process.env.PATHEXT;if(!r){return true}r=r.split(";");if(r.indexOf("")!==-1){return true}for(var n=0;n<r.length;n++){var s=r[n].toLowerCase();if(s&&e.substr(-s.length).toLowerCase()===s){return true}}return false}function checkStat(e,t,r){if(!e.isSymbolicLink()&&!e.isFile()){return false}return checkPathExt(t,r)}function isexe(e,t,r){n.stat(e,(function(n,s){r(n,n?false:checkStat(s,e,t))}))}function sync(e,t){return checkStat(n.statSync(e),e,t)}},284:e=>{"use strict";var t=process.platform==="win32";var r=t?/[^:]\\$/:/.\/$/;e.exports=function(){var e;if(t){e=process.env.TEMP||process.env.TMP||(process.env.SystemRoot||process.env.windir)+"\\temp"}else{e=process.env.TMPDIR||process.env.TMP||process.env.TEMP||"/tmp"}if(r.test(e)){e=e.slice(0,-1)}return e}},207:(e,t,r)=>{const n=process.platform==="win32"||process.env.OSTYPE==="cygwin"||process.env.OSTYPE==="msys";const s=r(17);const o=n?";":":";const i=r(126);const getNotFoundError=e=>Object.assign(new Error(`not found: ${e}`),{code:"ENOENT"});const getPathInfo=(e,t)=>{const r=t.colon||o;const s=e.match(/\//)||n&&e.match(/\\/)?[""]:[...n?[process.cwd()]:[],...(t.path||process.env.PATH||"").split(r)];const i=n?t.pathExt||process.env.PATHEXT||".EXE;.CMD;.BAT;.COM":"";const c=n?i.split(r):[""];if(n){if(e.indexOf(".")!==-1&&c[0]!=="")c.unshift("")}return{pathEnv:s,pathExt:c,pathExtExe:i}};const which=(e,t,r)=>{if(typeof t==="function"){r=t;t={}}if(!t)t={};const{pathEnv:n,pathExt:o,pathExtExe:c}=getPathInfo(e,t);const a=[];const step=r=>new Promise(((o,i)=>{if(r===n.length)return t.all&&a.length?o(a):i(getNotFoundError(e));const c=n[r];const u=/^".*"$/.test(c)?c.slice(1,-1):c;const f=s.join(u,e);const p=!u&&/^\.[\\\/]/.test(e)?e.slice(0,2)+f:f;o(subStep(p,r,0))}));const subStep=(e,r,n)=>new Promise(((s,u)=>{if(n===o.length)return s(step(r+1));const f=o[n];i(e+f,{pathExt:c},((o,i)=>{if(!o&&i){if(t.all)a.push(e+f);else return s(e+f)}return s(subStep(e,r,n+1))}))}));return r?step(0).then((e=>r(null,e)),r):step(0)};const whichSync=(e,t)=>{t=t||{};const{pathEnv:r,pathExt:n,pathExtExe:o}=getPathInfo(e,t);const c=[];for(let a=0;a<r.length;a++){const u=r[a];const f=/^".*"$/.test(u)?u.slice(1,-1):u;const p=s.join(f,e);const l=!f&&/^\.[\\\/]/.test(e)?e.slice(0,2)+p:p;for(let e=0;e<n.length;e++){const r=l+n[e];try{const e=i.sync(r,{pathExt:o});if(e){if(t.all)c.push(r);else return r}}catch(e){}}}if(t.all&&c.length)return c;if(t.nothrow)return null;throw getNotFoundError(e)};e.exports=which;which.sync=whichSync},129:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:true});t.name=void 0;t.name="ca"},260:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:true});t.name=void 0;t.name="convert"},417:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:true});t.debug=t.name=void 0;t.name="debug";function debug(e,t){if(process.env.CI==="true"){console.info(`::group::${e}`);console.debug(JSON.stringify(t,null,3));console.info("::endgroup::")}}t.debug=debug},707:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:true});t.isError=t.deleteTempFiles=t.createPasswordFile=t.ciphers=t.toHex=t.isHex=t.isNumber=t.name=void 0;t.name="helper";var n=r(17);var s=r(147);var o=r(113);var i=r(284);var c=process.env.PEMJS_TMPDIR||i();function isNumber(e){if(Array.isArray(e)){return false}return/^\d+$/g.test(e)}t.isNumber=isNumber;function isHex(e){return/^(0x)?([0-9A-F]{1,40}|[0-9A-F]{1,40})$/gi.test(e)}t.isHex=isHex;function toHex(e){var t="";for(var r=0;r<e.length;r++){t+=""+e.charCodeAt(r).toString(16)}return t}t.toHex=toHex;t.ciphers=["aes128","aes192","aes256","camellia128","camellia192","camellia256","des","des3","idea"];function createPasswordFile(e,r,i){if(!e||!Object.prototype.hasOwnProperty.call(e,"password")||!Object.prototype.hasOwnProperty.call(e,"passType")||!/^(word|in|out)$/.test(e.passType)){return false}var a=n.join(c,o.randomBytes(20).toString("hex"));i.push(a);e.password=e.password.trim();if(e.password===""){e.mustPass=true}if(e.cipher&&t.ciphers.indexOf(e.cipher)!==-1){r.push("-"+e.cipher)}r.push("-pass"+e.passType);if(e.mustPass){r.push("pass:"+e.password)}else{s.writeFileSync(a,e.password);r.push("file:"+a)}return true}t.createPasswordFile=createPasswordFile;function deleteTempFiles(e,t){var r=[];if(typeof e==="string"){r.push(e)}else if(Array.isArray(e)){r=e}else{return t(new Error("Unexcepted files parameter type; only string or array supported"))}var deleteSeries=function(e,t){if(e.length){var r=e.shift();var myCallback=function(r){console.log(r.constructor.name);if(isError(r)&&r.code==="ENOENT"){return deleteSeries(e,t)}else if(r){return t(r)}else{return deleteSeries(e,t)}};if(r&&typeof r==="string"){s.unlink(r,myCallback)}else{return deleteSeries(e,t)}}else{return t(null)}};deleteSeries(r,t)}t.deleteTempFiles=deleteTempFiles;function isError(e){return e instanceof Error}t.isError=isError},865:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){if(n===undefined)n=r;Object.defineProperty(e,n,{enumerable:true,get:function(){return t[r]}})}:function(e,t,r,n){if(n===undefined)n=r;e[n]=t[r]});var s=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:true,value:t})}:function(e,t){e["default"]=t});var o=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(e!=null)for(var r in e)if(r!=="default"&&Object.prototype.hasOwnProperty.call(e,r))n(t,e,r);s(t,e);return t};var i=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:true});t.spawnWrapper=t.spawn=t.execBinary=t.exec=t.get=t.set=t.name=void 0;t.name="openssl";const c=o(r(707));const a=r(417);const u=r(81);const f=i(r(17));const p=i(r(147));const l=i(r(284));const d=i(r(113));const v=i(r(207));const h={};const x=process.env.PEMJS_TMPDIR||(0,l.default)();const _=new RegExp("^(OpenSSL|LibreSSL) (((\\d+).(\\d+)).(\\d+))([a-z]+)?");if("CI"in process.env&&process.env.CI==="true"){if("LIBRARY"in process.env&&"VERSION"in process.env&&process.env.LIBRARY!=""&&process.env.VERSION!=""){const e=`./openssl/${process.env.LIBRARY}_v${process.env.VERSION}/bin/openssl`;if(p.default.existsSync(e)){process.env.OPENSSL_BIN=e}}}function set(e,t){h[e]=t}t.set=set;function get(e){return h[e]||undefined}t.get=get;function exec(e,t,r,n){spawnWrapper((function(t,n,s,o){if(t){return e(t)}let i,c;let a,u;if((a=s.match(new RegExp("-+BEGIN "+r+"-+$","mu")))&&a.index!==undefined){i=a.index}else{i=-1}if(r==="EC PARAMETERS"){r="EC PRIVATE KEY"}if((u=s.match(new RegExp("^\\-+END "+r+"\\-+","m")))&&u.index!==undefined){c=u.index+u[0].length}else{c=-1}if(i>=0&&c>=0){return e(null,s.substring(i,c))}else{return e(new Error(r+" not found from openssl output:\n---stdout---\n"+s+"\n---stderr---\n"+o+"\ncode: "+n))}}),t,n,false)}t.exec=exec;function execBinary(e,t,r){spawnWrapper((function(t,r,n,s){(0,a.debug)("execBinary",{err:t,code:r,stdout:n,stderr:s});if(t){return e(t)}return e(null,n)}),t,r,true)}t.execBinary=execBinary;function spawn(e,t,r){var n=get("pathOpenSSL")||process.env.OPENSSL_BIN||"openssl";testOpenSSLPath(n,(function(s){if(s){return e(s)}var o=(0,u.spawn)(n,t);var i=r?Buffer.alloc(0):"";var c=r?Buffer.alloc(0):"";o.stdout.on("data",(function(e){if(!r){c+=e.toString("binary")}else{c=Buffer.concat([c,e])}}));o.stderr.on("data",(function(e){i+=e.toString("binary")}));var a=2;var f=-1;var p=false;var done=function(r){if(p){return}if(r){p=true;return e(r)}if(--a<1){p=true;if(f!==0){if(f===2&&(i===""||/depth lookup: unable to/.test(i)||/depth lookup: self(-|\s)signed certificate/.test(i))){return e(null,f,c,i)}return e(new Error("Invalid openssl exit code: "+f+"\n% openssl "+t.join(" ")+"\n"+i),f)}else{return e(null,f,c,i)}}};o.on("error",done);o.on("exit",(function(e){f=e;done()}));o.on("close",(function(){c=r?c:c.toString("utf-8");i=i.toString("utf-8");done()}))}))}t.spawn=spawn;function spawnWrapper(e,t,r,n){if(n===undefined){n=false}var s=[];var o=[];if(r!==undefined){r=[].concat(r);var i,u;for(u=0;u<t.length;u++){if(t[u]==="--TMPFILE--"){i=f.default.join(x,d.default.randomBytes(20).toString("hex"));s.push({path:i,contents:r.shift()});t[u]=i;o.push(i)}}}var l;for(u=0;u<s.length;u++){l=s[u];p.default.writeFileSync(l.path,l.contents)}spawn((function(r,n,s,i){c.deleteTempFiles(o,(function(o){(0,a.debug)(t[0],{err:r,fsErr:o,code:n,stdout:s,stderr:i});e(r||o,n,s,i)}))}),t,n)}t.spawnWrapper=spawnWrapper;function testOpenSSLPath(e,t){(0,v.default)(e,(function(r){if(r){return t(new Error("Could not find openssl on your system on this path: "+e))}t(r)}))}spawn((function(e,t,r,n){var s=String(r)+"\n"+String(n)+"\n"+String(e);let o=_.exec(s);if(o===null||o.length<=7)return;set("openSslVersion",o[1].toUpperCase());set("Vendor",o[1].toUpperCase());set("VendorVersion",o[2]);set("VendorVersionMajorMinor",o[3]);set("VendorVersionMajor",o[4]);set("VendorVersionMinor",o[5]);set("VendorVersionPatch",o[6]);set("VendorVersionBuildChar",typeof o[7]==="undefined"?"":o[7])}),["version"],false)},81:e=>{"use strict";e.exports=require("child_process")},113:e=>{"use strict";e.exports=require("crypto")},147:e=>{"use strict";e.exports=require("fs")},17:e=>{"use strict";e.exports=require("path")}};var t={};function __nccwpck_require__(r){var n=t[r];if(n!==undefined){return n.exports}var s=t[r]={exports:{}};var o=true;try{e[r].call(s.exports,s,s.exports,__nccwpck_require__);o=false}finally{if(o)delete t[r]}return s.exports}if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var r={};(()=>{"use strict";var e=r;Object.defineProperty(e,"__esModule",{value:true});const t=__nccwpck_require__(260);const n=__nccwpck_require__(129);const s=__nccwpck_require__(707);const o=__nccwpck_require__(865);function run(){console.log(t.name);console.log(n.name);console.log(s.name);console.log(o.name)}run()})();module.exports=r})();
//# sourceMappingURL=index.js.map