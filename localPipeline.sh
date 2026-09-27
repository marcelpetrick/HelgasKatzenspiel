#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
# SPDX-License-Identifier: GPL-3.0-or-later
#
# localPipeline.sh — the full quality gate, run before every commit. GitHub Actions runs the same.
#
# Usage: ./localPipeline.sh [--no-e2e] [--no-docker] [--help]
#
# Stages, in order; the first failure stops the run:
#   1. install     npm ci when node_modules does not match package-lock.json
#   2. eslint      type-aware lint of all TypeScript
#   3. prettier    formatting check
#   4. stylelint   CSS lint
#   5. markdown    markdownlint on every .md file
#   6. typecheck   tsc --noEmit (strict)
#   7. coverage    Vitest unit tests with ≥ 95 % coverage of src/core enforced
#   8. build       production build into dist/
#   9. e2e         Playwright in headless Chromium against the built game (skip with --no-e2e)
#  10. docker      build the Docker image and check it serves the game (scripts/docker-check.sh;
#                  skip with --no-docker, skipped automatically when Docker is not available)
#
# A summary with the duration of each stage is printed at the end. Exit code 0 means all green.

set -u
set -o pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR" || exit 1

RUN_E2E=true
RUN_DOCKER=true
for arg in "$@"; do
  case "$arg" in
    --no-e2e) RUN_E2E=false ;;
    --no-docker) RUN_DOCKER=false ;;
    -h | --help)
      sed -n '5,23p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Unknown option: $arg (see --help)" >&2
      exit 2
      ;;
  esac
done

declare -a SUMMARY=()
FAILED=""

stage() {
  local name="$1"
  shift
  printf '\n\033[1;35m▶ %s\033[0m  %s\n' "$name" "$*"
  local start=$SECONDS
  if "$@"; then
    SUMMARY+=("$(printf '  ✅ %-10s %4ss' "$name" $((SECONDS - start)))")
  else
    SUMMARY+=("$(printf '  ❌ %-10s %4ss' "$name" $((SECONDS - start)))")
    FAILED="$name"
    summary
    exit 1
  fi
}

summary() {
  printf '\n\033[1mPipeline summary\033[0m\n'
  printf '%s\n' "${SUMMARY[@]}"
  if [[ -n "$FAILED" ]]; then
    printf '\033[1;31mFAILED at stage: %s\033[0m\n' "$FAILED"
  else
    printf '\033[1;32mAll stages green.\033[0m\n'
  fi
}

# Are the installed packages exactly the ones in package-lock.json? Only names and versions count, so
# the version bump in every commit does not trigger a reinstall. A reinstall wipes Vite's dependency
# cache in node_modules/.vite and breaks a dev server that is running at the same time.
deps_match_lock() {
  [[ -f node_modules/.package-lock.json ]] || return 1
  node -e '
    const lock = require("./package-lock.json").packages;
    const installed = require("./node_modules/.package-lock.json").packages;
    const fs = require("fs");
    // Optional packages for other platforms (e.g. rolldown for macOS) are never installed here.
    const skipped = (p) => p.optional === true || p.devOptional === true;
    const ok =
      Object.entries(lock).every(([k, p]) => k === "" || (installed[k] ? installed[k].version === p.version : skipped(p))) &&
      Object.keys(installed).every((k) => k in lock && (installed[k].link === true || fs.existsSync(k + "/package.json")));
    process.exit(ok ? 0 : 1);
  '
}

install_deps() {
  if deps_match_lock; then
    echo "node_modules matches package-lock.json"
  else
    npm ci
  fi
}

stage install install_deps
stage eslint npx eslint .
stage prettier npx prettier --check .
stage stylelint npx stylelint "src/**/*.css"
stage markdown npx markdownlint-cli2 "**/*.md"
stage typecheck npx tsc --noEmit
stage coverage npx vitest run --coverage
stage build npx vite build
if [[ "$RUN_E2E" == true ]]; then
  stage e2e npx playwright test
else
  SUMMARY+=("  ⏭  e2e        skipped (--no-e2e)")
fi
if [[ "$RUN_DOCKER" == true ]] && docker info >/dev/null 2>&1; then
  stage docker scripts/docker-check.sh
else
  SUMMARY+=("  ⏭  docker     skipped (--no-docker or Docker not available)")
fi
summary
