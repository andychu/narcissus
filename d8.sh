#!/bin/bash
#
# d8.sh
# Author: Andy Chu
#
# Demo of running narcissus directly under d8.

time ~/svn/v8-read-only/d8 \
    -e 'var exports={};' \
    ../../engines/default/lib/json.js \
    ../../engines/default/lib/object.js \
    lib/narcissus.js \
    -e 'print(JSON.stringify(parse("var i=0;"), null, 2));'
