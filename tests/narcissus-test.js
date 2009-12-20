#!/usr/bin/env narwhal
var narcissus = require('narcissus');

var file = require('file'),
    json = require('json');

print("\n\n");
print("DEFS");
for (var name in narcissus) {
  print(name);
}
print("\n\n");

exports.testMain = function() {
    var code = "for (var i = 0; i < 10; i++) { print(i); }";

    // Can parse JSON Template, but can't execute it yet.
    //var code = file.open('testdata/json-template.js').read();
    print(code);
    var parseTree = narcissus.parse(code);

    print("Done parsing");

    var execResult = narcissus.execute(
        parseTree, new narcissus.ExecutionContext(narcissus.GLOBAL_CODE));
    //print("execResult " + execResult);

    parseTree = narcissus.parse("function t() {return true;}");
    //print(parseTree);

    execResult = narcissus.execute(
        parseTree, new narcissus.ExecutionContext(narcissus.FUNCTION_CODE));
    //print("execResult FUNCTION_CODE " + execResult);

    parseTree = narcissus.parse(
        "function t() {print('in function t ***'); return true;}");

    execResult = narcissus.execute(
        parseTree, new narcissus.ExecutionContext(narcissus.EVAL_CODE));
    print("execResult EVAL_CODE " + execResult);
}

exports.testSimpleCode = function() {
    var code = file.open('testdata/simple.js').read();

    print(code);
    var parseTree = narcissus.parse(code);
    print("Done parsing");
    var execResult = narcissus.evaluate(code);
}

exports.testFormat = function() {
    var code = file.open('testdata/simple.js').read();
    print(code);
    var parseTree = narcissus.parse(code);

    print("PARSED");
    print(json.stringify(parseTree, null, 2));

    print("FORMAT");
    print(narcissus.format(parseTree));
    print("DONE FORMAT");
}

exports.testFunction = function() {
    // TODO: Make this work
    return;
    var code = file.open('testdata/function.js').read();

    print(code);
    var result = narcissus.evaluate(code);
    print("testFunction " + result);
}

exports.testParseRealCode = function() {
    var code = file.open('testdata/json-template.js').read();
    return;
    var parseTree = narcissus.parse(code);
    print(json.stringify(parseTree, null, 2));
    print("FORMAT");
    print(narcissus.format(parseTree));
    print("DONE FORMAT");
}

if (require.main === module.id)
    require("test/runner").run(exports);
