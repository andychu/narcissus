#!/usr/bin/env narwhal
var narcissus = require('narcissus');

var file = require('file'),
    os = require('os'),
    json = require('json');

// Hack for v8
var BASE_DIR = '/home/andy/git/narwhal2/packages/narcissus';

function testFileContents(path) {
  var absPath = file.join(BASE_DIR, path);
  return file.open(absPath).read();
}

print("\n\n");
print("NARCISSUS");
for (var name in narcissus) {
  print(name);
}
print("\n\n");

var forLoop = "for (var i = 0; i < 10; i++) { print(i); }";

exports.testLoopParse = function() {

    // Can parse JSON Template, but can't execute it yet.
    //var code = file.open('testdata/json-template.js').read();
    print(forLoop);
    var parseTree = narcissus.parse(forLoop);

    print("Done parsing");

    if (narcissus.execute) {
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
}

exports.testSimpleCode = function() {
    var code = testFileContents('testdata/simple.js');

    print(code);
    var parseTree = narcissus.parse(code);
    print("Done parsing");
    //var execResult = narcissus.evaluate(code);
}

exports.testFunction = function() {
    // TODO: Make this work
    var code = testFileContents('testdata/function.js');
    //var result = narcissus.evaluate(code);
    //print("testFunction " + result);
}

exports.testParseRealCode = function() {
    var code = testFileContents('testdata/json-template.js');
    //return; // disabled for Rhino
    var parseTree = narcissus.parse(code);
    return;
    try {
      var result = narcissus.evaluate(code);
    } catch (e) {
      print('name ' + e.name);
      print('message ' + e.message);
      print('stack ' + e.stack);
    }
    print('RESULT ' + result);
}

exports.testParseItself = function() {
    //var code = testFileContents('lib/narcissus.js');
    var code = testFileContents('patched/jsdefs.js');
    var code = testFileContents('patched/jsparse.js');

    // TODO: Parse error in jsexec.js
    var code = testFileContents('patched/jsexec.js');
    try {
      var parseTree = narcissus.parse(code);
    } catch (e) {
      print('name ' + e.name);
      print('message ' + e.message);
      print('stack ' + e.stack);
    }
}

exports.testBreak = function() {
    var code = testFileContents('testdata/break.js');
    var parseTree = narcissus.parse(code);
    //print(json.stringify(parseTree, null, 2));
}

exports.testTokenizer = function() {
    var code = testFileContents('testdata/break.js');
    print(code);
    var t = new narcissus.Tokenizer(code);
    for (var i=0; i<10; i++) {
      print(t.get());
      var token = t.token();
      print(json.stringify(token));
      //print(t.token());
    }
}


if (require.main === module.id)
    require("test/runner").run(exports);
