#!/bin/bash
#
# d8.sh
# Author: Andy Chu
#
# Demo of running narcissus directly under d8.
# 
# Usage: d8.sh <file to parse>

time ~/svn/v8-read-only/d8 \
    -e 'var exports={};' \
    ../../engines/default/lib/json.js \
    ../../engines/default/lib/object.js \
    lib/narcissus.js \
    -e "var jsCode=read('$1');" \
    -e 'print(JSON.stringify(parse(jsCode), null, 2));'
