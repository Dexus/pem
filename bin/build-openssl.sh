#!/bin/bash
set -ex
[ -z "$TARGET" ] && TARGET="x86_64-unknown-linux-gnu"

OWN_BINARY=$(basename $0)
SCRIPT_PATH="$(
  cd "$(dirname "$0")" >/dev/null 2>&1
  pwd -P
)"
OWN_BINARY_PATH="${SCRIPT_PATH}/${OWN_BINARY}"
NORMAL_PATH=$(pwd)

checkDebInstalled() {
  REQUIRED_PKG="$1"
  PKG_OK=$(dpkg-query -W --showformat='${Status}\n' "${REQUIRED_PKG}" | grep "install ok installed" || true)
  echo "Checking for ${REQUIRED_PKG}: ${PKG_OK}"
  if [ "" = "${PKG_OK}" ]; then
    echo "No ${REQUIRED_PKG}. Setting up ${REQUIRED_PKG}."
    sudo apt-get --yes --no-install-recommends install "${REQUIRED_PKG}"
  fi
}

OPENSSL_LOCAL_DIR="${NORMAL_PATH}/openssl"
OPENSSL_DIR="${NORMAL_PATH}/openssl/${LIBRARY}_v${VERSION}"
OPENSSL_BUILD_DIR="${OPENSSL_DIR}_build"

if [ -f "${OPENSSL_DIR}/bin/openssl" ] && [ "$FORCE" != "true" ]; then
  exit 0
fi

if [ ! -d "${OPENSSL_DIR}" ]; then
  mkdir -p "${OPENSSL_DIR}"
fi

case "${LIBRARY}" in
"libressl")
  URL1="http://ftp.eu.openbsd.org/pub/OpenBSD/LibreSSL/libressl-${VERSION}.tar.gz"
  URL2="http://ftp3.usa.openbsd.org/pub/OpenBSD/LibreSSL/libressl-${VERSION}.tar.gz"
  URL3="https://github.com/libressl/portable/releases/download/v${VERSION}/libressl-${VERSION}.tar.gz"
  ;;
"openssl")
  # Release tarballs live in the openssl/openssl GitHub releases; pre-3.0
  # tags use the OpenSSL_X_Y_Z<letter> scheme, newer tags are openssl-X.Y.Z.
  case "${VERSION}" in
  [012].*)
    URL1="https://github.com/openssl/openssl/releases/download/OpenSSL_${VERSION//./_}/openssl-${VERSION}.tar.gz"
    ;;
  *)
    URL1="https://github.com/openssl/openssl/releases/download/openssl-${VERSION}/openssl-${VERSION}.tar.gz"
    ;;
  esac
  URL2="https://openssl-library.org/source/openssl-${VERSION}.tar.gz"
  URL3="http://mirrors.ibiblio.org/openssl/source/openssl-${VERSION}.tar.gz"
  ;;
esac

# OpenSSL 1.0.x and earlier do not support parallel make; -j produces
# undefined-reference link errors (e.g. OBJ_cmp, ERR_load_OBJStrings).
MAKE_JOBS="-j$(nproc)"
if [ "${LIBRARY}" = "openssl" ]; then
  case "${VERSION}" in
  0.*|1.0.*)
    MAKE_JOBS=""
    ;;
  esac
fi

case "${TARGET}" in
"x86_64-unknown-linux-gnu")
  OS_COMPILER=linux-x86_64
  ;;
"i686-unknown-linux-gnu")
  OS_COMPILER=linux-elf
  OS_FLAGS=-m32
  ;;
"arm-unknown-linux-gnueabihf")
  OS_COMPILER=linux-armv4
  export AR=arm-linux-gnueabihf-ar
  export CC=arm-linux-gnueabihf-gcc
  ;;
esac

mkdir -p "${OPENSSL_BUILD_DIR}"
cd "${OPENSSL_BUILD_DIR}"

OUT="${OPENSSL_LOCAL_DIR}/${LIBRARY}_${VERSION}.tgz"
MAX_REDIRECTS=5
if [ ! -f "${OUT}" ]; then
  # -f so a 404 page is never saved as the tarball; try mirrors in order.
  curl -o "${OUT}" -fL --max-redirs ${MAX_REDIRECTS} "${URL1}" ||
    curl -o "${OUT}" -fL --max-redirs ${MAX_REDIRECTS} "${URL2}" ||
    curl -o "${OUT}" -fL --max-redirs ${MAX_REDIRECTS} "${URL3}"
fi
if [ "$(ls -A "${OPENSSL_BUILD_DIR}")" ]; then
  echo "Take action ${OPENSSL_BUILD_DIR} is not Empty"
else
  tar --strip-components=1 -xzf "${OUT}"
fi

case "${LIBRARY}" in
"openssl")
  if [ "${FIPS:-false}" = "true" ]; then
    # The FIPS provider is a loadable module (fips.so); a -static build
    # produces no modules at all, so configure a shared-capable build
    # with the FIPS provider enabled.
    ./Configure --prefix="${OPENSSL_DIR}" --openssldir="${OPENSSL_DIR}/ssl" enable-fips ${OS_COMPILER} -fPIC -g ${OS_FLAGS}
  else
    ./Configure --prefix="${OPENSSL_DIR}" --openssldir="${OPENSSL_DIR}/ssl" no-shared ${OS_COMPILER} -fPIC -g ${OS_FLAGS} -static
  fi
  ;;
"libressl")
  ./configure --prefix="${OPENSSL_DIR}" --disable-shared --with-pic
  ;;
esac

make ${MAKE_JOBS}
# LibreSSL 2.2.x and older have no install_sw target yet.
if make -n install_sw >/dev/null 2>&1; then
  make install_sw
else
  make install
fi
if [ "${LIBRARY}" = "openssl" ] && [ "${FIPS:-false}" = "true" ]; then
  # install_sw does not install the provider modules; the FIPS provider
  # (fips.so) comes from its own install target.
  make install_fips
fi

case "${LIBRARY}" in
"openssl")
  if [[ ! -f "${OPENSSL_DIR}/ssl/openssl.cnf" ]] && [[ -f "apps/openssl.cnf" ]]; then mkdir -p "${OPENSSL_DIR}/ssl" && cp apps/openssl.cnf "${OPENSSL_DIR}/ssl/openssl.cnf"; fi
  ;;
"libressl")
  if [[ ! -f "${OPENSSL_DIR}/ssl/openssl.cnf" ]] && [[ -f "apps/openssl/openssl.cnf" ]]; then mkdir -p "${OPENSSL_DIR}/ssl" && cp apps/openssl/openssl.cnf "${OPENSSL_DIR}/ssl/openssl.cnf"; fi
  ;;
esac
rm -rf "${OPENSSL_BUILD_DIR}/"
sudo chown -Rf $(id -u):$(id -g) "${OPENSSL_LOCAL_DIR}"
chmod -Rf 0755 "${OPENSSL_LOCAL_DIR}"
cd "${NORMAL_PATH}"
