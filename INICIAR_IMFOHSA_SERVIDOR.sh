#!/usr/bin/env sh
set -eu
APP_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
export IMFOHSA_ROOT="$APP_DIR"
export IMFOHSA_PORT="${IMFOHSA_PORT:-8946}"
export IMFOHSA_ENV="${IMFOHSA_ENV:-production}"
cd "$APP_DIR"
exec "$APP_DIR/IMFOHSA_SERVIDOR"

