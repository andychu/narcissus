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


class JsVerifier(testy.StandardVerifier):
  """Verify the JS implementation of Narcissus."""

  def __init__(self, *args, **kwargs):
    testy.StandardVerifier.__init__(self, *args, **kwargs)
    self.js_runner = os_process.Runner()
    self.py_runner = os_process.Runner(cwd=PY_NARCISSUS_ROOT)

  def _TestPath(self, path):
    return os.path.join(PY_NARCISSUS_ROOT, path)

  def _TestContents(self, path):
    return open(self._TestPath(path)).read()

  def ParseTree(self, test_file):
    js_input = self._TestContents(test_file)

    cmd = './sexp.py'
    p = self.py_runner.Pipes(cmd, 'IO')
    py_out, _ = p.communicate(js_input)

    print py_out

    js_cmd = './nw.sh $PWD/bin/narcissus %s' % self._TestPath(test_file)
    js_out = self.js_runner.Result(js_cmd).stdout
    print js_out


class SimpleTest(testy.Test):

  VERIFIERS = [JsVerifier]

  def setUpOnce(self):
    self.runner = os_process.Runner(cwd=PY_NARCISSUS_ROOT)

  def testSmall(self):
    cmd = './jsparser.py tests/mjsunit/source/regress-1039610.js'
    print self.runner.Result(cmd).stdout

  def testSmallExample(self):
    self.verify.ParseTree('tests/mjsunit/source/regress-1039610.js')


if __name__ == '__main__':
  # One-time setup
  os.system('build/makelib.py')

  testy.RunThisModule()
