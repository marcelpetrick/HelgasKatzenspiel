#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
# SPDX-License-Identifier: GPL-3.0-or-later
#
# docker-check.sh — build the Docker image and prove that it serves the game.
#
# Usage: scripts/docker-check.sh [image-tag]     (default tag: helgas-katzenspiel:local)
#
# Builds the image, starts a container on a free port, checks that the page and its JavaScript
# bundle are served with HTTP 200, and removes the container again. Exit code 0 means the image works.
# Run it yourself afterwards with: docker run --rm -p 8080:80 helgas-katzenspiel:local

set -euo pipefail

TAG="${1:-helgas-katzenspiel:local}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAME="katzenspiel-check-$$"

docker build -t "$TAG" "$ROOT_DIR"
docker run -d --rm --name "$NAME" -p 127.0.0.1::80 "$TAG" >/dev/null
trap 'docker stop "$NAME" >/dev/null 2>&1 || true' EXIT
PORT="$(docker port "$NAME" 80/tcp | head -n1 | sed 's/.*://')"
URL="http://127.0.0.1:${PORT}"

for _ in $(seq 1 30); do
  curl -fsS "$URL/" >/dev/null 2>&1 && break
  sleep 0.5
done
PAGE="$(curl -fsS "$URL/")"
grep -q '<title>Helgas Katzenspiel</title>' <<<"$PAGE" || { echo "page does not look like the game" >&2; exit 1; }
BUNDLE="$(grep -o 'assets/index-[^"]*\.js' <<<"$PAGE" | head -n1)"
[[ -n "$BUNDLE" ]] || { echo "no JavaScript bundle referenced" >&2; exit 1; }
curl -fsS -o /dev/null "$URL/$BUNDLE"
echo "Docker image $TAG serves the game at $URL (bundle $BUNDLE) ✔"
