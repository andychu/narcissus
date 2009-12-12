#!/usr/bin/env narwhal
var defs = require('narcissus/defs');
var parse = require('narcissus/parse');
var format = require('narcissus/format');
//var exec = require('narcissus/exec');

print('defs ' + defs);
print('parse ' + defs);

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

var parseTree = parse.parse("var i = 10;");
var parseTree = parse.parse("for (var i = 0; i < 10; i++) { print(i); }");
var parseTree = parse.parse("if (i = 0) { i++; }");
//var parseTree = parse.parse("// hello");
print(parseTree);
print(format.format(parseTree));

//print('exec ' + exec);
