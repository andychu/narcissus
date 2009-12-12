#!/usr/bin/env narwhal
var defs = require('narcissus/defs');
var parse = require('narcissus/parse');
var format = require('narcissus/format');
var exec = require('narcissus/exec');

print("\n\n");
print("DEFS");
for (var name in defs) {
  print(name);
}

print("\n\n");
print("PARSE");
for (var name in parse) {
  print(name);
}

print("\n\n");
print("FORMAT");
for (var name in format) {
  print(name);
}

print("\n\n");
print("EXEC");
for (var name in exec) {
  print(name);
}

print("\n\n");

var parseTree = parse.parse("var i = 10;");
var parseTree = parse.parse("for (var i = 0; i < 10; i++) { print(i); }");
var parseTree = parse.parse("var i=5; i;");
var parseTree = parse.parse("print('*** Printing from inside Narcissus');");
//var parseTree = parse.parse("// hello");
//print(parseTree);
//print(format.format(parseTree));

var execResult = exec.execute(
    parseTree, new exec.ExecutionContext(exec.GLOBAL_CODE));
//print("execResult " + execResult);

parseTree = parse.parse("function t() {return true;}");
//print(parseTree);

execResult = exec.execute(
    parseTree, new exec.ExecutionContext(exec.FUNCTION_CODE));
//print("execResult FUNCTION_CODE " + execResult);

parseTree = parse.parse(
    "function t() {print('in function t ***'); return true;}");

execResult = exec.execute(
    parseTree, new exec.ExecutionContext(exec.EVAL_CODE));
print("execResult EVAL_CODE " + execResult);
