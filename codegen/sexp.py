#!/usr/bin/python -S
"""
sexp.py

Demonstration of using JSON Template to format JSON parse trees from this
modified version of Narcissus.
"""

__author__ = 'Andy Chu'


import os
import sys
import traceback

this_dir = os.path.dirname(sys.argv[0])

# HACK
sys.path.append('/home/andy/hg/json-template/python')
  #os.path.join(this_dir, '..', 'build')
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
      # jprint v['type'], '==', user_str
      #print v['type']== user_str
      if v is None:
        return False  # This makes None values expand empty?
      return v['type'] == user_str
    # For debugging in the trace
    func.__name__ = '<%s>' % user_str
    return func, None  # No arguments

node_predicates = NodePredicates()

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

    {.or function}
      function {name} ({.repeated section params}{@}{.alternates with}, {.end})
          {.meta-left}{.newline}
        {body|template SELF}
      }{.newline}

    {.or for}
    for ({setup|template SELF}; {#}
         {condition|template SELF}; {#}
         {update|template SELF}) {.meta-left} {.newline}
      {body|template SELF}
    } {.newline}

    {.or if}
      if ({condition|template SELF}) {.meta-left}{.newline}
        {thenPart|template SELF}{.newline}
      {.section elsePart}
        } else {.meta-left}{.newline}
          {@|template SELF}{.newline}
        }{.newline}
      {.end}

    {.or switch}
    switch ({discriminant|template SELF}) {.meta-left} {.newline}
      {.repeated section cases}
        {@|template SELF}
      {.end}
    } {.newline}

    {.or case}
      case {caseLabel|template SELF}: {.newline}
        {statements|template SELF}

    {.or default}
      default: {.newline}
        {statements|template SELF}

    {.or var}
      var {.repeated section children}
            {.section initializer}
              {name} = {@|template SELF}
            {.or}
              {name}
            {.end}
          {.alternates with},
          {.end};
          {.newline}

    {.or ;}  {# statement}
      {expression|template SELF};
    {.or CALL}
      {a|template SELF}({b|template SELF})
    {.or LIST}  {# e.g. argument list}
      {.repeated section children}
        {@|template SELF}
      {.alternates with},
      {.end}

    {# ---------------- }
    {# BINARY OPERATORS }
    {# ---------------- }

    {.or .} 
      {a|template SELF}.{b|template SELF}
    {.or INDEX} 
      {a|template SELF}[{b|template SELF}]
    {.or =} 
      {a|template SELF} = {b|template SELF}

    {.or <}
      {a|template SELF} < {b|template SELF}
    {.or >}
      {a|template SELF} > {b|template SELF}
    {.or <=}
      {a|template SELF} <= {b|template SELF}
    {.or >=}
      {a|template SELF} >= {b|template SELF}
    {.or +}
      {a|template SELF} + {b|template SELF}
    {.or %}
      {a|template SELF} % {b|template SELF}
    {.or ===}
      {a|template SELF} === {b|template SELF}
    {.or ||}
      {a|template SELF} || {b|template SELF}
    {.or &&}
      {a|template SELF} && {b|template SELF}
    {.or |}
      {a|template SELF} | {b|template SELF}
    {.or &}
      {a|template SELF} & {b|template SELF}
    {.or ^}
      {a|template SELF} ^ {b|template SELF}

    {# --------------- }
    {# UNARY OPERATORS }
    {# --------------- }

    {.or ++}
      {# TODO: fix}
      {.if postfix}
        {a|template SELF}++
      {.or}
        ++{a|template SELF}
      {.end}
    {.or return}
      return {value|template SELF};

    {.or OBJECT_INIT}
      {.meta-left}
      {.repeated section children}
        {@|template SELF}{.newline}
      {.alternates with}, {.end}
      {.meta-right}  {# TODO: fill in}

    {.or PROPERTY_INIT}
      {a|template SELF}: {b|template SELF}

    {.or NEW_WITH_ARGS}
      new {a|template SELF}({b|template SELF});
    {.or throw}
      throw {exception|template SELF};{.newline}
    {.or IDENTIFIER}
      {value}
    {.or NUMBER}
      {value}
    {.or STRING}
      "{value}"  {# TODO: Proper quoting}
    {.or REGEXP}
      /regexp/  {# TODO: why is this missing from narcissus?}

    {# --------- }
    {# CONSTANTS }
    {# --------- }

    {.or null}
      null
    {.end}
    """),
    more_predicates=node_predicates, whitespace='strip-line', undefined_str='')


def main(argv):
  """Returns an exit code."""

  filename = os.path.join(this_dir, argv[1])
  parse_tree = json.loads(open(filename).read())
  try:
    print statement.expand(parse_tree, trace=jsontemplate.Trace())
  except jsontemplate.EvaluationError, e:
    _, _, tb = sys.exc_info()
    traceback.print_tb(tb)
    print e
    print '-----'
    if e.original_exc_info:
      etype, evalue, etraceback = e.original_exc_info
      traceback.print_tb(etraceback)
      print evalue

    if e.trace:
      print e.trace
      print e.trace.stack
    else:
      print 'no trace'

  return 0


if __name__ == '__main__':
  try:
    sys.exit(main(sys.argv))
  except Error, e:
    print >> sys.stderr, e.args[0]
    sys.exit(1)
