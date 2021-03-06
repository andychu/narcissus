#!/usr/bin/python -S
"""
makelib.py

Concatenates the Narcissus source files to make a Narwhal package.

Run this script from the narcissus package root (the directory it lives in)
"""

__author__ = 'Andy Chu'


import sys

import jsontemplate


class Error(Exception):
  pass


_TEMPLATE = """\
//
// Generated by build/makelib.py -- DO NOT EDIT
//

{license}

{.repeated section sources}
//
// {name}
//

{contents}

{.end}

//
// Generated by build/makelib.py -- DO NOT EDIT
//
"""

def main(argv):
  """Returns an exit code."""
  filenames = [
      'patched/jsdefs.js',
      'patched/jsparse.js',

      # TODO: jsexec does a lot of crap at the top level (at require()-time),
      # including calling Object.defineProperty and such.  Most people only care
      # about the parser, so disable it for now.
      # Probably should factor it into a 'narcissus/exec' module, keeping
      # 'narcissus' for the parser.
      #'patched/jsexec.js',

      # TODO: probably don't need this, could delete
      #'patched/jsformat.js',
      ]

  sources = []
  for name in filenames:
    sources.append({'name': name, 'contents': open(name).read()})

  license = open('patched/LICENSE').read()

  t = jsontemplate.Template(_TEMPLATE)
  lib = t.expand({'sources': sources, 'license': license})
  outname = 'lib/narcissus.js'
  f = open(outname, 'w')
  f.write(lib)
  f.close()
  print >> sys.stderr, 'Wrote %s' % outname


if __name__ == '__main__':
  try:
    sys.exit(main(sys.argv))
  except Error, e:
    print >> sys.stderr, e.args[0]
    sys.exit(1)
