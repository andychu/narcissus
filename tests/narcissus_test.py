#!/usr/bin/python -S
"""
narcissus_test.py

Compare the output of narcissus-on-Narwhal with pynarcissus (which outputs
s-expressions on v8 testdata)
"""

__author__ = 'Andy Chu'


import os
import sys

sys.path.append('../../../../svn/pan/trunk')  # HACK
from pan.core import os_process
from pan.test import testy

PY_NARCISSUS_ROOT = '/home/andy/svn/pynarcissus-read-only'

class SimpleTest(testy.Test):

  def setUpOnce(self):
    self.runner = os_process.Runner(cwd=PY_NARCISSUS_ROOT)

  def testSmall(self):
    cmd = './jsparser.py tests/mjsunit/source/regress-1039610.js'
    print self.runner.Result(cmd).stdout

  def testSmallSexp(self):
    cmd = './sexp.py'
    js_input = open(os.path.join(
        PY_NARCISSUS_ROOT, 'tests/mjsunit/source/regress-1039610.js')).read()
    p = self.runner.Pipes(cmd, 'IO')
    stdout, stderr = p.communicate(js_input)
    print stdout


if __name__ == '__main__':
  testy.RunThisModule()
