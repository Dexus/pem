#!/usr/bin/env bash
[ -z "$TARGET" ] && TARGET="openssl_v1.1.1l"
[ -z "$OS_PASS" ] && OS_PASS="AbCd1234"

OWN_BINARY=$(basename $0)
SCRIPT_PATH="$(
  cd "$(dirname "$0")" >/dev/null 2>&1
  pwd -P
)"
OWN_BINARY_PATH="${SCRIPT_PATH}/${OWN_BINARY}"
NORMAL_PATH=$(pwd)
FIXTURES_PATH="${SCRIPT_PATH}/../test/fixtures"

OPENSSL_BIN="${SCRIPT_PATH}/../openssl/${TARGET}/bin/openssl"
export OPENSSL_CONF="${SCRIPT_PATH}/../test/fixtures/test2.cnf"
$OPENSSL_BIN version
i=1
echo "TAG: ${i}"; export PEM_BUILD="$i"
$OPENSSL_BIN req -x509 -newkey rsa:4096 -keyout "${FIXTURES_PATH}/rsa_pkcs12_${i}_key.pem" -out "${FIXTURES_PATH}/rsa_pkcs12_${i}_cert.pem" -days 365 -nodes
$OPENSSL_BIN rsa -in "${FIXTURES_PATH}/rsa_pkcs12_${i}_key.pem" -out "${FIXTURES_PATH}/rsa_pkcs12_${i}_key_RSA.pem"
$OPENSSL_BIN pkcs12 -export -out "${FIXTURES_PATH}/rsa_pkcs12_${i}_keyStore.p12" -inkey "${FIXTURES_PATH}/rsa_pkcs12_${i}_key.pem" -in "${FIXTURES_PATH}/rsa_pkcs12_${i}_cert.pem" -passout pass:

((i=i+1))
echo "TAG: ${i}"
export PEM_BUILD="$i"
sleep 0.5
$OPENSSL_BIN req -x509 -newkey rsa:4096 -keyout "${FIXTURES_PATH}/rsa_pkcs12_${i}_key.pem" -out "${FIXTURES_PATH}/rsa_pkcs12_${i}_cert.pem" -days 365 -passout "pass:${OS_PASS}"
$OPENSSL_BIN rsa -in "${FIXTURES_PATH}/rsa_pkcs12_${i}_key.pem" -passin "pass:${OS_PASS}" -out "${FIXTURES_PATH}/rsa_pkcs12_${i}_key_RSA.pem" -passout "pass:${OS_PASS}"
$OPENSSL_BIN pkcs12 -export -out "${FIXTURES_PATH}/rsa_pkcs12_${i}_keyStore.p12" -inkey "${FIXTURES_PATH}/rsa_pkcs12_${i}_key.pem" -passin "pass:${OS_PASS}" -in "${FIXTURES_PATH}/rsa_pkcs12_${i}_cert.pem"  -passout pass:

((i=i+1))
echo "TAG: ${i}"
export PEM_BUILD="$i"
sleep 0.5
$OPENSSL_BIN req -x509 -newkey rsa:4096 -keyout "${FIXTURES_PATH}/rsa_pkcs12_${i}_key.pem" -out "${FIXTURES_PATH}/rsa_pkcs12_${i}_cert.pem" -days 365 -passout "pass:${OS_PASS}"
$OPENSSL_BIN rsa -in "${FIXTURES_PATH}/rsa_pkcs12_${i}_key.pem" -passin "pass:${OS_PASS}" -out "${FIXTURES_PATH}/rsa_pkcs12_${i}_key_RSA.pem" -passout "pass:${OS_PASS}"
$OPENSSL_BIN pkcs12 -export -out "${FIXTURES_PATH}/rsa_pkcs12_${i}_keyStore.p12" -inkey "${FIXTURES_PATH}/rsa_pkcs12_${i}_key.pem" -passin "pass:${OS_PASS}" -in "${FIXTURES_PATH}/rsa_pkcs12_${i}_cert.pem"  -passout "pass:${OS_PASS}"

((i=i+1))
echo "TAG: ${i}"
export PEM_BUILD="$i"
sleep 0.5
$OPENSSL_BIN req -x509 -newkey rsa:4096 -keyout "${FIXTURES_PATH}/rsa_pkcs12_${i}_key.pem" -out "${FIXTURES_PATH}/rsa_pkcs12_${i}_cert.pem" -days 365 -passout "pass:${OS_PASS}"
$OPENSSL_BIN rsa -in "${FIXTURES_PATH}/rsa_pkcs12_${i}_key.pem" -passin "pass:${OS_PASS}" -out "${FIXTURES_PATH}/rsa_pkcs12_${i}_key_RSA.pem" -passout "pass:${OS_PASS}"
$OPENSSL_BIN pkcs12 -export -out "${FIXTURES_PATH}/rsa_pkcs12_${i}_keyStore.p12" -inkey "${FIXTURES_PATH}/rsa_pkcs12_${i}_key.pem" -passin "pass:${OS_PASS}" -in "${FIXTURES_PATH}/rsa_pkcs12_${i}_cert.pem" -certfile "${FIXTURES_PATH}/GeoTrust_Primary_CA.pem"  -passout "pass:${OS_PASS}"

((i2=i))
((i=i+1))
echo "TAG: ${i}"
export PEM_BUILD="$i"
sleep 0.5
$OPENSSL_BIN req -x509 -newkey rsa:4096 -keyout "${FIXTURES_PATH}/rsa_pkcs12_${i}_key.pem" -out "${FIXTURES_PATH}/rsa_pkcs12_${i}_cert.pem" -days 365 -nodes
$OPENSSL_BIN rsa -in "${FIXTURES_PATH}/rsa_pkcs12_${i}_key.pem" -out "${FIXTURES_PATH}/rsa_pkcs12_${i}_key_RSA.pem"
cat "${FIXTURES_PATH}/rsa_pkcs12_${i2}_cert.pem" "${FIXTURES_PATH}/GeoTrust_Primary_CA.pem" > "${FIXTURES_PATH}/rsa_pkcs12_${i}_CAs.pem"
{
  cat "${FIXTURES_PATH}/rsa_pkcs12_${i}_cert.pem"
  cat "${FIXTURES_PATH}/rsa_pkcs12_${i2}_cert.pem"
  cat "${FIXTURES_PATH}/GeoTrust_Primary_CA.pem"
} > "${FIXTURES_PATH}/rsa_pkcs12_${i}_CAs2.pem"

$OPENSSL_BIN pkcs12 -export -out "${FIXTURES_PATH}/rsa_pkcs12_${i}_keyStore.p12" -inkey "${FIXTURES_PATH}/rsa_pkcs12_${i}_key.pem" -in "${FIXTURES_PATH}/rsa_pkcs12_${i}_cert.pem" -certfile "${FIXTURES_PATH}/rsa_pkcs12_${i}_CAs.pem"  -passout "pass:"
$OPENSSL_BIN pkcs12 -export -out "${FIXTURES_PATH}/rsa_pkcs12_${i}_keyStore2.p12" -inkey "${FIXTURES_PATH}/rsa_pkcs12_${i}_key.pem" -in "${FIXTURES_PATH}/rsa_pkcs12_${i}_CAs2.pem"  -passout "pass:"

((i=i+1))
echo "TAG: ${i}"
export PEM_BUILD="$i"
sleep 0.5

