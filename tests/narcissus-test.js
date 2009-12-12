#!/usr/bin/env narwhal
var defs = require('narcissus/defs');
var parse = require('narcissus/parse');
var format = require('narcissus/format');
var exec = require('narcissus/exec');

print("");
print("");
print("DEFS");
for (var name in defs) {
  print(name);
}
print("");
print("");
print("PARSE");
for (var name in parse) {
  print(name);
}

print("");
print("");
print("FORMAT");
for (var name in format) {
  print(name);
}

print("");
print("");
print("EXEC");
for (var name in exec) {
  print(name);
}

var parseTree = parse.parse("var i = 10;");
var parseTree = parse.parse("for (var i = 0; i < 10; i++) { print(i); }");
var parseTree = parse.parse("var i=5; i");
//var parseTree = parse.parse("// hello");
//print(parseTree);
print(format.format(parseTree));

var execResult = exec.execute(
    parseTree, new exec.ExecutionContext(exec.GLOBAL_CODE));
print("execResult " + execResult);
