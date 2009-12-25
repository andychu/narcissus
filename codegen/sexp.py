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
from pan.core import util

B = util.BlockStr


class Error(Exception):
  pass


class NodePredicates(jsontemplate.FunctionRegistry):
  def Lookup(self, user_str):
    """The node type is also a predicate."""
    def func(v, context, args):
      print v['type'], '==', user_str
      print v['type']== user_str
      return v['type'] == user_str
    return func, None  # No arguments

node_predicates = NodePredicates()

expr = jsontemplate.Template(
    B("""
    {.if PLUS}
    {a} + {b}
    {.or MINUS}
    {a} - {b}
    {.or MULT}
    {a} * {b}
    {.or DIV}
    {a} / {b}
    {.or FUNC}
    {@|template func}
    {.end}
    """), more_predicates=node_predicates)

func = jsontemplate.Template(
    B("""
    function ({.repeated section params}{@} {.end}) {
      {.repeated section exprs}
      {@|template expr}
      {.end}
    }
    """))

script = jsontemplate.Template(
    B("""
    """))

statement = jsontemplate.Template(
    B("""
    {.if SCRIPT}
      {.repeated section children}
      {@|template SELF}
      {.end}
    {.or BLOCK}
      {.repeated section children}
      {@|template SELF}
      {.end}
    {.or for}
    for ({setup|template SELF};{condition|template SELF};{update|template SELF}) {
      {body|template SELF}
    }
    {.or var}
      var {.repeated section children}
            {.section initializer}
              {name} = {@|template SELF}
            {.or}
              {name}
            {.end}
          {.alternates with},
          {.end};
    {.or <}
      {a|template SELF} < {b|template SELF}
    {.or ++}
      {.if postfix}
        {a|template SELF}++
      {.or}
        ++{a|template SELF}
      {.end}
    {.or IDENTIFIER}
      {value}
    {.or NUMBER}
      {value}
    {.end}
    """), more_predicates=node_predicates)


def main(argv):
  """Returns an exit code."""

  filename = os.path.join(this_dir, 'loop.json')
  parse_tree = json.loads(open(filename).read())

  jsontemplate.MakeTemplateGroup(
      {'func': func, 'expr': expr, 'script': script, 'statement': statement})
  print statement.expand(parse_tree)
  return 0


if __name__ == '__main__':
  try:
    sys.exit(main(sys.argv))
  except Error, e:
    print >> sys.stderr, e.args[0]
    sys.exit(1)
