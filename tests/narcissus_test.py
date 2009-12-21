#!/usr/bin/python -S
"""
narcissus_test.py

Compare the output of narcissus-on-Narwhal with pynarcissus (which outputs
s-expressions on v8 testdata)
"""

__author__ = 'Andy Chu'


import commands
import glob
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
    # Hack to work around v8 spew
    js_out = js_out.split('PARSE TREE')[1].strip()
    print js_out

  def ParseTreeOfSnippet(self, snippet):
    cmd = './sexp.py'
    p = self.py_runner.Pipes(cmd, 'IO')
    py_out, _ = p.communicate(snippet)

    js_cmd = "./nw.sh $PWD/bin/narcissus -j -e %s" % commands.mkarg(snippet)
    js_out = self.js_runner.Result(js_cmd).stdout
    # Hack to work around v8 spew
    js_out = js_out.split('PARSE TREE')[1].strip()

    self.LongStringsEqual(py_out, js_out)


class SimpleTest(testy.Test):

  VERIFIERS = [JsVerifier]

  def setUpOnce(self):
    self.runner = os_process.Runner(cwd=PY_NARCISSUS_ROOT)

  def testVar(self):
    self.verify.ParseTreeOfSnippet('var x=99;')

  def testLoop(self):
    self.verify.ParseTreeOfSnippet(
        'for (var i=0; i<10; i++) { print(i); }')

  def testFunction(self):
    self.verify.ParseTreeOfSnippet(
        'function foo() { return 5; }')

  def testSmall(self):
    cmd = './jsparser.py tests/mjsunit/source/regress-1039610.js'
    print self.runner.Result(cmd).stdout

  def testSmallExample(self):
    self.verify.ParseTree('tests/mjsunit/source/regress-1039610.js')

  def testParsingAll(self):
    test_files = glob.glob(
        os.path.join(PY_NARCISSUS_ROOT, 'tests/mjsunit/source/*.js'))
    runner = os_process.Runner()
    for test_file in test_files:
      print test_file
      # TODO: output JSON, and parse it, count nodes, etc.
      js_cmd = './nw.sh $PWD/bin/narcissus %s' % test_file
      js_out = runner.Result(js_cmd).stdout
      # Hack to work around v8 spew
      js_out = js_out.split('PARSE TREE')[1].strip()
      print len(js_out)
      self.verify.IsTrue(len(js_out) > 20, js_out)

    print '%s test files' % len(test_files)


if __name__ == '__main__':
  # One-time setup
  os.system('build/makelib.py')

  testy.RunThisModule()
