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

if [ -n "$1" ] && [ -n "$2" ]; then
  LIBRARY="$1"
  VERSION="$2"

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
    ;;
  "openssl")
    URL1="https://openssl.org/source/openssl-${VERSION}.tar.gz"
    URL2="http://mirrors.ibiblio.org/openssl/source/openssl-${VERSION}.tar.gz"
    ;;
  esac

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
    curl -o "${OUT}" -L --max-redirs ${MAX_REDIRECTS} "${URL1}" ||
      curl -o "${OUT}" -L --max-redirs ${MAX_REDIRECTS} "${URL2}"
  fi
  if [ "$(ls -A "${OPENSSL_BUILD_DIR}")" ]; then
    echo "Take action ${OPENSSL_BUILD_DIR} is not Empty"
  else
    tar --strip-components=1 -xzf "${OUT}"
  fi

  case "${LIBRARY}" in
  "openssl")
    ./Configure --prefix="${OPENSSL_DIR}" --openssldir="${OPENSSL_DIR}" no-shared ${OS_COMPILER} -fPIC -g ${OS_FLAGS} -static
    ;;
  "libressl")
    ./configure --prefix="${OPENSSL_DIR}" --disable-shared --with-pic
    ;;
  esac

  make -j$(nproc)
  make install

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
else

  sudo true

  for pkg in "curl" "build-essential" "checkinstall" "zlib1g-dev" "libtemplate-perl"; do
    checkDebInstalled "$pkg"
  done

  exec <"${NORMAL_PATH}/versions"
  while read line; do
    parseLibVersion=(${line//:/ })
    printf "%s\0%s\0" "${parseLibVersion[0]}" "${parseLibVersion[1]}"
  done | xargs -0 -n 2 -P 2 bash -c "${OWN_BINARY_PATH} \"\$@\"" --

fi
cd "${NORMAL_PATH}"
