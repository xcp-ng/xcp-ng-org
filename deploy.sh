#!/usr/bin/env bash
# Pull master and rebuild the documentation site.
#
# The build goes to a scratch directory and is only moved into place once it has
# succeeded, so a commit that does not build can no longer take the site down.
#
# This matters because "docusaurus build" empties its output directory before
# webpack starts, not after it finishes: see clearPath(outDir) in
# @docusaurus/core/lib/commands/build/buildLocale.js, which runs in the same
# Promise.all as the config generation. Therefore, building straight into the
# live directory leaves nothing to serve for the whole build, and nothing
# at all if the build then fails.

set -Eeuo pipefail

PATH="/bin:/usr/bin:/usr/local/bin:/var/www/n/bin"

cd "$(dirname "$0")"

live="build"
staging="build.new"
previous="build.prev"

# Keep one past log. Until now, each run overwrote it, so the log of a failed
# build was gone by the time anyone came to read it.
if [ -f build.log ]; then
    mv -f build.log build.log.1
fi
exec > build.log 2>&1

on_failure() {
    echo "Pull and build FAILED at $(date)"
    echo "The live site was left untouched."
    rm -rf "$staging"
    exit 1
}
trap on_failure ERR

echo "Pull and build triggered at $(date)"

git fetch
git reset --hard origin/master

# Install potential new plugins
npm i

# Generate the doc into staging, never into the directory being served
rm -rf "$staging"
npm run build -- --out-dir "$staging"

# The new site is now fully built and ready to go live
rm -rf "$previous"
if [ -d "$live" ]; then
    mv "$live" "$previous"
fi
mv "$staging" "$live"

echo "Pull and build done at $(date)"
