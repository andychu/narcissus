#!/usr/bin/env narwhal
var defs = require('narcissus/defs'),
    parse = require('narcissus/parse'),
    format = require('narcissus/format'),
    exec = require('narcissus/exec');

var file = require('file');

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

exports.testMain = function() {
    var code = "for (var i = 0; i < 10; i++) { print(i); }";

    // Can parse JSON Template, but can't execute it yet.
    //var code = file.open('testdata/json-template.js').read();
    print(code);
    var parseTree = parse.parse(code);

    print("Done parsing");

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
}


if (require.main === module.id)
    require("test/runner").run(exports);
