#!/usr/bin/env bash
PATH="/bin:/usr/bin:/user/local/bin:/var/www/n/bin"
exec > build.log 2>&1
start=`date`

echo "Pull and build triggered at $start"
git pull
# Install potential new plugins
npm i
# Generate the doc
npm run build
end=`date`
echo "Pull and build done at $end"
