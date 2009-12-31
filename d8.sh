#!/bin/bash
#
# d8.sh
# Author: Andy Chu
#
# Demo of running narcissus directly under d8.
# 
# Usage: d8.sh <file to parse>

build/makelib.py

action=$1
filename=$2

if [ $action == "parse" ]; then
  code=$(cat <<'EOF'
try {
  print(JSON.stringify(parse(jsCode), null, 2));
} catch (e) {
  print('Parse error: ' + e);
  //print(e.source);
  print('Cursor ' + e.cursor);
}
EOF)
else
  code='evaluate(jsCode);'
fi

time ~/svn/v8-read-only/d8 \
    -e 'var exports={};' \
    ../../engines/default/lib/json.js \
    ../../engines/default/lib/object.js \
    lib/narcissus.js \
    -e "var jsCode=read('$filename');" \
    -e "$code"
