#!/usr/bin/python -S
"""
sexp.py
"""

__author__ = 'Andy Chu'


import os
import sys

this_dir = os.path.dirname(sys.argv[0])

# HACK
sys.path.append(os.path.join(this_dir, '..', 'build'))
import jsontemplate

# HACK
sys.path.append('/home/andy/svn/pan/trunk')
from pan.core import json


class Error(Exception):
  pass


def main(argv):
  """Returns an exit code."""

  filename = os.path.join(this_dir, 'loop.json')
  parse_tree = json.loads(open(filename).read())
  print parse_tree
  return 0


if __name__ == '__main__':
  try:
    sys.exit(main(sys.argv))
  except Error, e:
    print >> sys.stderr, e.args[0]
    sys.exit(1)
