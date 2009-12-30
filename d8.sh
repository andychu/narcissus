#!/bin/bash
#
# d8.sh
# Author: Andy Chu
#
# Demo of running narcissus directly under d8.
# 
# Usage: d8.sh <file to parse>

action=$1
filename=$2

if [ $action == "parse" ]; then
  code='print(JSON.stringify(parse(jsCode), null, 2));'
else
  code='evaluate(jsCode);'
fi

time ~/svn/v8-read-only/d8 \
    -e 'var exports={};' \
    ../../engines/default/lib/json.js \
    ../../engines/default/lib/object.js \
    lib/narcissus.js \
    -e "var jsCode=read('$filename');" \
    -e $code
