# Change Log
All notable changes to this project will be documented in this file. This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased](https://github.com/papakai/pem/compare/v1.11.0...HEAD)

### Merged
* Update semantic-release to the latest version 🚀 [`#134`](https://github.com/papakai/pem/pull/134)


## [v1.11.0](https://github.com/papakai/pem/compare/v1.9.8...v1.11.0) - 2017-09-13

### Fixed
* Fix #132 new version 1.10.1 [`#132`](https://github.com/papakai/pem/issues/132)


## [v1.9.8](https://github.com/papakai/pem/compare/v1.9.6...v1.9.8) - 2017-09-03

### Merged
* Allow array values for CSRs [`#124`](https://github.com/papakai/pem/pull/124)

### Fixed
* chore(package): update semantic-release to version 7.0.2 [`#128`](https://github.com/papakai/pem/issues/128)


## [v1.9.6](https://github.com/papakai/pem/compare/v1.9.4...v1.9.6) - 2017-04-27

### Merged
* Update README [`#119`](https://github.com/papakai/pem/pull/119)
* Revert "Regex support for new format with spaces" [`#113`](https://github.com/papakai/pem/pull/113)
* Regex support for new format with spaces [`#111`](https://github.com/papakai/pem/pull/111)
* Greenkeeper/initial [`#110`](https://github.com/papakai/pem/pull/110)


## [v1.9.4](https://github.com/papakai/pem/compare/v1.8.3...v1.9.4) - 2016-12-01

### Merged
* Added noop callback (Node 7.0 deprecation warning) [`#91`](https://github.com/papakai/pem/pull/91)

### Fixed
* Add support for DC Certificates fix #83 [`#83`](https://github.com/papakai/pem/issues/83)
* Only generate altNames config if it is a non-empty array (#78) [`https://github.com/andris9/pem/issues/77`](https://github.com/andris9/pem/issues/77)


## [v1.8.3](https://github.com/papakai/pem/compare/1.8.1...v1.8.3) - 2016-05-02

### Merged
* Update package.json versions [`#70`](https://github.com/papakai/pem/pull/70)
* Refactor temp dir logic [`#63`](https://github.com/papakai/pem/pull/63)
* Add CA certs to pkcs12 file and read pkcs12 files [`#62`](https://github.com/papakai/pem/pull/62)

### Fixed
* Allow commas in CSR fields (#74) [`#73`](https://github.com/papakai/pem/issues/73)


## [1.8.1](https://github.com/papakai/pem/compare/1.8.0...1.8.1) - 2015-09-20

### Merged
* No match fix at preg_match_all [`#61`](https://github.com/papakai/pem/pull/61)


## [1.8.0](https://github.com/papakai/pem/compare/v1.7.1...1.8.0) - 2015-08-26

### Merged
* Adds method to verify a certificate's signing chain [`#60`](https://github.com/papakai/pem/pull/60)
* Added functionality to export key and certificate to PKCS12 keystore [`#59`](https://github.com/papakai/pem/pull/59)
* Added functionality to get modulus from a  password protected key [`#53`](https://github.com/papakai/pem/pull/53)
* Include Issuer Data with Fetch Cert Data Function [`#50`](https://github.com/papakai/pem/pull/50)


## [v1.7.1](https://github.com/papakai/pem/compare/v1.7.0...v1.7.1) - 2015-02-27

### Merged
* Creating a CSR for an encrypted key [`#49`](https://github.com/papakai/pem/pull/49)
* bump to 1.7.0 [`#2`](https://github.com/papakai/pem/pull/2)


## [v1.7.0](https://github.com/papakai/pem/compare/v1.6.0...v1.7.0) - 2015-02-25

### Merged
* Private key encryption [`#48`](https://github.com/papakai/pem/pull/48)
* Merge latest PEM version [`#1`](https://github.com/papakai/pem/pull/1)


## [v1.6.0](https://github.com/papakai/pem/compare/v1.5.0...v1.6.0) - 2015-02-24

### Merged
* Add function to create dhparam keys [`#47`](https://github.com/papakai/pem/pull/47)


## [v1.5.0](https://github.com/papakai/pem/compare/v1.4.6...v1.5.0) - 2015-01-19

### Commits
* Merge branch 'noamokman-feature-add-node-which' [`3124430`](https://github.com/papakai/pem/commit/3124430e401151732aad5aa531be4146291d60dd)


## [v1.4.6](https://github.com/papakai/pem/compare/v1.4.5...v1.4.6) - 2015-01-18

### Merged
* Just added indentations [`#39`](https://github.com/papakai/pem/pull/39)
* Fix to catch errors on spawn [`#38`](https://github.com/papakai/pem/pull/38)
* Update pem.js [`#36`](https://github.com/papakai/pem/pull/36)


## [v1.4.5](https://github.com/papakai/pem/compare/v1.4.4...v1.4.5) - 2015-01-05

### Merged
* Bugfix pathOpenSSL typo; Add environmental option for openssl binary [`#33`](https://github.com/papakai/pem/pull/33)
* Add missing serviceCertificate & serial option to the doc [`#32`](https://github.com/papakai/pem/pull/32)


## [v1.4.4](https://github.com/papakai/pem/compare/v1.4.3...v1.4.4) - 2014-12-13

### Merged
* Update README.md [`#28`](https://github.com/papakai/pem/pull/28)
* Add hash option for createCertificate(), default to sha256 [`#29`](https://github.com/papakai/pem/pull/29)


## [v1.4.3](https://github.com/papakai/pem/compare/v1.4.2...v1.4.3) - 2014-12-09

### Merged
* Update README.md to correct copy/paste error [`#26`](https://github.com/papakai/pem/pull/26)
* Add OpenSSL path config() [`#25`](https://github.com/papakai/pem/pull/25)


## [v1.4.2](https://github.com/papakai/pem/compare/v1.4.1...v1.4.2) - 2014-11-28

### Merged
* getModulus() will now accept Buffers [`#24`](https://github.com/papakai/pem/pull/24)


## [v1.4.1](https://github.com/papakai/pem/compare/v1.4.0...v1.4.1) - 2014-05-10

### Merged
* fix wildcard certificate creation [`#19`](https://github.com/papakai/pem/pull/19)


## [v1.4.0](https://github.com/papakai/pem/compare/v1.3.0...v1.4.0) - 2014-03-27

### Merged
* Change to BEGIN(\sNEW)? CERTIFICATE REQUEST [`#15`](https://github.com/papakai/pem/pull/15)


## [v1.3.0](https://github.com/papakai/pem/compare/v0.2.2...v1.3.0) - 2014-03-18

### Merged
* Change SAN CSR process. [`#13`](https://github.com/papakai/pem/pull/13)
* add SAN integration for readCertificateInfo [`#12`](https://github.com/papakai/pem/pull/12)
* Easier to set temp dir, and all temp files are unlinked after use [`#11`](https://github.com/papakai/pem/pull/11)
* altNames option to set subjectAltName [`#10`](https://github.com/papakai/pem/pull/10)


## [v0.2.2](https://github.com/papakai/pem/compare/v0.2.1...v0.2.2) - 2013-06-17

### Merged
* Add certificate validity information to readCertificateInfo callback [`#9`](https://github.com/papakai/pem/pull/9)


## [v0.2.1](https://github.com/papakai/pem/compare/v0.2.0...v0.2.1) - 2013-06-09

### Merged
* update README.md, and improve unit test for getModulus function [`#8`](https://github.com/papakai/pem/pull/8)
* add getModulus function [`#7`](https://github.com/papakai/pem/pull/7)


## [v0.2.0](https://github.com/papakai/pem/compare/v0.1.0...v0.2.0) - 2013-04-17

### Merged
* Add getFingerprint, fix intermittent failure [`#1`](https://github.com/papakai/pem/pull/1)


## v0.1.0 - 2012-06-25

### Commits
* added tests [`85d2d09`](https://github.com/papakai/pem/commit/85d2d0992d9a2ea055f5cea9fa669f467f7f5f28)
