/* vim: set sw=4 ts=8 et tw=78: */
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the Narcissus JavaScript engine.
 *
 * The Initial Developer of the Original Code is
 * Brendan Eich <brendan@mozilla.org>.
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *  Kris Kowal <kris@cixar.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * Narcissus - JS implemented in JS.
 *
 * Lexical scanner and parser.
 */

var defs = require('./defs');

var get = function (object, key, fallback) {
    if (Object.prototype.hasOwnProperty.call(object, key))
        return object[key];
    return fallback;
};

// Build a regexp that recognizes operators and punctuators (except newline).
var opRegExpSrc = "^";
for (i in defs.opTypeNames) {
    if (i == '\n')
        continue;
    if (opRegExpSrc != "^")
        opRegExpSrc += "|^";
    opRegExpSrc += i.replace(/[?|^&(){}\[\]+\-*\/\.]/g, "\\$&");
}
var opRegExp = new RegExp(opRegExpSrc);

// A regexp to match floating point literals (but not integer literals).
var fpRegExp = /^\d+\.\d*(?:[eE][-+]?\d+)?|^\d+(?:\.\d*)?[eE][-+]?\d+|^\.\d+(?:[eE][-+]?\d+)?/;

// A regexp to match regexp literals.
var reRegExp = /^\/((?:\\.|\[(?:\\.|[^\]])*\]|[^\/])+)\/([gimy]*)/;

var Tokenizer = exports.Tokenizer = function Tokenizer(s, f, l) {
    this.cursor = 0;
    this.source = String(s);
    this.tokens = [];
    this.tokenIndex = 0;
    this.lookahead = 0;
    this.scanNewlines = false;
    this.scanOperand = true;
    this.filename = f || "";
    this.lineno = l || 1;
}

Tokenizer.prototype = {

    get input() {
        return this.source.substring(this.cursor);
    },

    get done() {
        return this.peek() == defs.END;
    },

    get token() {
        return this.tokens[this.tokenIndex];
    },

    match: function (tt) {
        return this.get() == tt || this.unget();
    },

    mustMatch: function (tt) {
        if (!this.match(tt))
            throw this.newSyntaxError("Missing " + defs.tokens[tt].toLowerCase());
        return this.token;
    },

    peek: function () {
        var tt, next;
        if (this.lookahead) {
            next = this.tokens[(this.tokenIndex + this.lookahead) & 3];
            if (this.scanNewlines && next.lineno != this.lineno)
                tt = defs.NEWLINE;
            else
                tt = next.type;
        } else {
            tt = this.get();
            this.unget();
        }
        return tt;
    },

    peekOnSameLine: function () {
        this.scanNewlines = true;
        var tt = this.peek();
        this.scanNewlines = false;
        return tt;
    },

    get: function () {
        var token;
        while (this.lookahead) {
            --this.lookahead;
            this.tokenIndex = (this.tokenIndex + 1) & 3;
            token = this.tokens[this.tokenIndex];
            if (token.type != defs.NEWLINE || this.scanNewlines)
                return token.type;
        }

        for (;;) {
            var input = this.input;
            var match = (this.scanNewlines ? /^[ \t]+/ : /^\s+/)(input);
            if (match) {
                var spaces = match[0];
                this.cursor += spaces.length;
                var newlines = spaces.match(/\n/g);
                if (newlines)
                    this.lineno += newlines.length;
                input = this.input;
            }

            if (!(match = /^\/(?:\*(?:.|\n)*?\*\/|\/.*)/(input)))
                break;
            var comment = match[0];
            this.cursor += comment.length;
            newlines = comment.match(/\n/g);
            if (newlines)
                this.lineno += newlines.length
        }

        this.tokenIndex = (this.tokenIndex + 1) & 3;
        token = this.tokens[this.tokenIndex];
        if (!token)
            this.tokens[this.tokenIndex] = token = {};

        if (!input)
            return token.type = defs.END;

        if ((match = fpRegExp(input))) {
            token.type = defs.NUMBER;
            token.value = parseFloat(match[0]);
        } else if ((match = /^0[xX][\da-fA-F]+|^0[0-7]*|^\d+/(input))) {
            token.type = defs.NUMBER;
            token.value = parseInt(match[0]);
        } else if ((match = /^[$_\w]+/(input))) {       // FIXME no ES3 unicode
            var id = match[0];
            token.type = get(defs.keywords, id, defs.IDENTIFIER);
            token.value = id;
        } else if ((match = /^"(?:\\.|[^"])*"|^'(?:\\.|[^'])*'/(input))) { //"){
            token.type = defs.STRING;
            token.value = eval(match[0]);
        } else if (this.scanOperand && (match = reRegExp(input))) {
            token.type = defs.REGEXP;
            token.value = new RegExp(match[1], match[2]);
        } else if ((match = opRegExp(input))) {
            var op = match[0];
            if (defs.assignOps[op] && input[op.length] == '=') {
                token.type = defs.ASSIGN;
                token.assignOp = defs[defs.opTypeNames[op]];
                match[0] += '=';
            } else {
                token.type = defs[defs.opTypeNames[op]];
                if (this.scanOperand &&
                    (token.type == defs.PLUS || token.type == defs.MINUS)) {
                    token.type += defs.UNARY_PLUS - defs.PLUS;
                }
                token.assignOp = null;
            }
            token.value = op;
        } else if (this.scanNewlines && (match = /^\n/(input))) {
            token.type = defs.NEWLINE;
        } else {
            throw this.newSyntaxError("Illegal token");
        }

        token.start = this.cursor;
        this.cursor += match[0].length;
        token.end = this.cursor;
        token.lineno = this.lineno;
        return token.type;
    },

    unget: function () {
        if (++this.lookahead == 4) throw "PANIC: too much lookahead!";
        this.tokenIndex = (this.tokenIndex - 1) & 3;
    },

    newSyntaxError: function (m) {
        var e = new SyntaxError(m, this.filename, this.lineno);
        e.source = this.source;
        e.cursor = this.cursor;
        return e;
    }

};

var CompilerContext = exports.CompilerContext = function CompilerContext(inFunction) {
    this.inFunction = inFunction;
    this.stmtStack = [];
    this.funDecls = [];
    this.varDecls = [];
}

var CCp = CompilerContext.prototype;
CCp.bracketLevel = CCp.curlyLevel = CCp.parenLevel = CCp.hookLevel = 0;
CCp.ecmaStrictMode = CCp.inForLoopInit = false;

var Script = exports.Script = function Script(t, x) {
    var n = Statements(t, x);
    n.type = defs.SCRIPT;
    n.funDecls = x.funDecls;
    n.varDecls = x.varDecls;
    return n;
}

var top = function (stack) {
    return stack.length && stack[stack.length-1];
};

var Node = exports.Node = function Node(t, type) {
    var token = t.token;
    if (token) {
        this.type = type || token.type;
        this.value = token.value;
        this.lineno = token.lineno;
        this.start = token.start;
        this.end = token.end;
    } else {
        this.type = type;
        this.lineno = t.lineno;
    }
    this.tokenizer = t;

    for (var i = 2; i < arguments.length; i++)
        this.push(arguments[i]);
}

var Np = Node.prototype = new Array;
Np.constructor = Node;
Np.toSource = Object.prototype.toSource;

// Always use push to add operands to an expression, to update start and end.
Np.push = function (kid) {
    if (kid.start < this.start)
        this.start = kid.start;
    if (this.end < kid.end)
        this.end = kid.end;
    return Array.prototype.push.call(this, kid);
}

Node.indentLevel = 0;

function tokenstr(tt) {
    var t = defs.tokens[tt];
    return /^\W/.test(t) ? defs.opTypeNames[t] : t.toUpperCase();
}

Np.toString = function () {
    var a = [];
    for (var i in this) {
        if (this.hasOwnProperty(i) && i != 'type' && i != 'target')
            a.push({id: i, value: this[i]});
    }
    a.sort(function (a,b) { return (a.id < b.id) ? -1 : 1; });
    const INDENTATION = "    ";
    var n = ++Node.indentLevel;
    var s = "{\n" + repeat(INDENTATION, n) + "type: " + tokenstr(this.type);
    for (i = 0; i < a.length; i++)
        s += ",\n" + repeat(INDENTATION, n) + a[i].id + ": " + a[i].value;
    n = --Node.indentLevel;
    s += "\n" + repeat(INDENTATION, n) + "}";
    return s;
}

Np.getSource = function () {
    return this.tokenizer.source.slice(this.start, this.end);
};

Np.getFilename = function () {
    return this.tokenizer.filename;
};

var repeat = function (string, n) {
    var s = "", t = string + s;
    while (--n >= 0)
        s += t;
    return s;
};

// Statement stack and nested statement handler.
function nest(t, x, node, func, end) {
    x.stmtStack.push(node);
    var n = func(t, x);
    x.stmtStack.pop();
    end && t.mustMatch(end);
    return n;
}

var Statements = exports.Statements = function Statements(t, x) {
    var n = new Node(t, defs.BLOCK);
    x.stmtStack.push(n);
    while (!t.done && t.peek() != defs.RIGHT_CURLY) {
        n.push(Statement(t, x));
    }
    x.stmtStack.pop();
    return n;
}

var Block = exports.Block = function Block(t, x) {
    t.mustMatch(defs.LEFT_CURLY);
    var n = Statements(t, x);
    t.mustMatch(defs.RIGHT_CURLY);
    return n;
}

var DECLARED_FORM = 0, EXPRESSED_FORM = 1, STATEMENT_FORM = 2;

var Statement = exports.Statement = function Statement(t, x) {
    var i, label, n, n2, ss, tt = t.get();

    // Cases for statements ending in a right curly return early, avoiding the
    // common semicolon insertion magic after this switch.
    switch (tt) {
      case defs.FUNCTION:
        return FunctionDefinition(t, x, true,
                                  (x.stmtStack.length > 1)
                                  ? STATEMENT_FORM
                                  : DECLARED_FORM);

      case defs.LEFT_CURLY:
        n = Statements(t, x);
        t.mustMatch(defs.RIGHT_CURLY);
        return n;

      case defs.IF:
        n = new Node(t);
        n.condition = ParenExpression(t, x);
        x.stmtStack.push(n);
        n.thenPart = Statement(t, x);
        n.elsePart = t.match(defs.ELSE) ? Statement(t, x) : null;
        x.stmtStack.pop();
        return n;

      case defs.SWITCH:
        n = new Node(t);
        t.mustMatch(defs.LEFT_PAREN);
        n.discriminant = Expression(t, x);
        t.mustMatch(defs.RIGHT_PAREN);
        n.cases = [];
        n.defaultIndex = -1;
        x.stmtStack.push(n);
        t.mustMatch(defs.LEFT_CURLY);
        while ((tt = t.get()) != defs.RIGHT_CURLY) {
            switch (tt) {
              case defs.DEFAULT:
                if (n.defaultIndex >= 0)
                    throw t.newSyntaxError("More than one switch default");
                // FALL THROUGH
              case defs.CASE:
                n2 = new Node(t);
                if (tt == defs.DEFAULT)
                    n.defaultIndex = n.cases.length;
                else
                    n2.caseLabel = Expression(t, x, defs.COLON);
                break;
              default:
                throw t.newSyntaxError("Invalid switch case");
            }
            t.mustMatch(defs.COLON);
            n2.statements = new Node(t, defs.BLOCK);
            while ((tt=t.peek()) != defs.CASE && tt != defs.DEFAULT && tt != defs.RIGHT_CURLY)
                n2.statements.push(Statement(t, x));
            n.cases.push(n2);
        }
        x.stmtStack.pop();
        return n;

      case defs.FOR:
        n = new Node(t);
        n.isLoop = true;
        t.mustMatch(defs.LEFT_PAREN);
        if ((tt = t.peek()) != defs.SEMICOLON) {
            x.inForLoopInit = true;
            if (tt == defs.VAR || tt == defs.CONST) {
                t.get();
                n2 = Variables(t, x);
            } else {
                n2 = Expression(t, x);
            }
            x.inForLoopInit = false;
        }
        if (n2 && t.match(defs.IN)) {
            n.type = defs.FOR_IN;
            if (n2.type == defs.VAR) {
                if (n2.length != 1) {
                    throw new SyntaxError("Invalid for..in left-hand side",
                                          t.getFilename, n2.lineno);
                }

                // NB: n2[0].type == IDENTIFIER and n2[0].value == n2[0].name.
                n.iterator = n2[0];
                n.varDecl = n2;
            } else {
                n.iterator = n2;
                n.varDecl = null;
            }
            n.object = Expression(t, x);
        } else {
            n.setup = n2 || null;
            t.mustMatch(defs.SEMICOLON);
            n.condition = (t.peek() == defs.SEMICOLON) ? null : Expression(t, x);
            t.mustMatch(defs.SEMICOLON);
            n.update = (t.peek() == defs.RIGHT_PAREN) ? null : Expression(t, x);
        }
        t.mustMatch(defs.RIGHT_PAREN);
        n.body = nest(t, x, n, Statement);
        return n;

      case defs.WHILE:
        n = new Node(t);
        n.isLoop = true;
        n.condition = ParenExpression(t, x);
        n.body = nest(t, x, n, Statement);
        return n;

      case defs.DO:
        n = new Node(t);
        n.isLoop = true;
        n.body = nest(t, x, n, Statement, defs.WHILE);
        n.condition = ParenExpression(t, x);
        if (!x.ecmaStrictMode) {
            // <script language="JavaScript"> (without version hints) may need
            // automatic semicolon insertion without a newline after do-while.
            // See http://bugzilla.mozilla.org/show_bug.cgi?id=238945.
            t.match(defs.SEMICOLON);
            return n;
        }
        break;

      case defs.BREAK:
      case defs.CONTINUE:
        n = new Node(t);
        if (t.peekOnSameLine() == defs.IDENTIFIER) {
            t.get();
            n.label = t.token.value;
        }
        ss = x.stmtStack;
        i = ss.length;
        label = n.label;
        if (label) {
            do {
                if (--i < 0)
                    throw t.newSyntaxError("Label not found");
            } while (ss[i].label != label);
        } else {
            do {
                if (--i < 0) {
                    throw t.newSyntaxError("Invalid " + ((tt == defs.BREAK)
                                                         ? "break"
                                                         : "continue"));
                }
            } while (!ss[i].isLoop && (tt != defs.BREAK || ss[i].type != defs.SWITCH));
        }
        n.target = ss[i];
        break;

      case defs.TRY:
        n = new Node(t);
        n.tryBlock = Block(t, x);
        n.catchClauses = [];
        while (t.match(defs.CATCH)) {
            n2 = new Node(t);
            t.mustMatch(defs.LEFT_PAREN);
            n2.varName = t.mustMatch(defs.IDENTIFIER).value;
            if (t.match(defs.IF)) {
                if (x.ecmaStrictMode)
                    throw t.newSyntaxError("Illegal catch guard");
                if (n.catchClauses.length && !top(n.catchClauses).guard)
                    throw t.newSyntaxError("Guarded catch after unguarded");
                n2.guard = Expression(t, x);
            } else {
                n2.guard = null;
            }
            t.mustMatch(defs.RIGHT_PAREN);
            n2.block = Block(t, x);
            n.catchClauses.push(n2);
        }
        if (t.match(defs.FINALLY))
            n.finallyBlock = Block(t, x);
        if (!n.catchClauses.length && !n.finallyBlock)
            throw t.newSyntaxError("Invalid try statement");
        return n;

      case defs.CATCH:
      case defs.FINALLY:
        throw t.newSyntaxError(defs.tokens[tt] + " without preceding try");

      case defs.THROW:
        n = new Node(t);
        n.exception = Expression(t, x);
        break;

      case defs.RETURN:
        if (!x.inFunction)
            throw t.newSyntaxError("Invalid return");
        n = new Node(t);
        tt = t.peekOnSameLine();
        if (
            tt != defs.END &&
            tt != defs.NEWLINE &&
            tt != defs.SEMICOLON &&
            tt != defs.RIGHT_CURLY
        )
            n.value = Expression(t, x);
        break;

      case defs.WITH:
        n = new Node(t);
        n.object = ParenExpression(t, x);
        n.body = nest(t, x, n, Statement);
        return n;

      case defs.VAR:
      case defs.CONST:
        n = Variables(t, x);
        break;

      case defs.DEBUGGER:
        n = new Node(t);
        break;

      case defs.NEWLINE:
      case defs.SEMICOLON:
        n = new Node(t, defs.SEMICOLON);
        n.expression = null;
        return n;

      default:
        if (tt == defs.IDENTIFIER) {
            t.scanOperand = false;
            tt = t.peek();
            t.scanOperand = true;
            if (tt == defs.COLON) {
                label = t.token.value;
                ss = x.stmtStack;
                for (i = ss.length-1; i >= 0; --i) {
                    if (ss[i].label == label)
                        throw t.newSyntaxError("Duplicate label");
                }
                t.get();
                n = new Node(t, defs.LABEL);
                n.label = label;
                n.statement = nest(t, x, n, Statement);
                return n;
            }
        }

        n = new Node(t, defs.SEMICOLON);
        t.unget();
        n.expression = Expression(t, x);
        n.end = n.expression.end;
        break;
    }

    if (t.lineno == t.token.lineno) {
        tt = t.peekOnSameLine();
        if (tt != defs.END && tt != defs.NEWLINE && tt != defs.SEMICOLON && tt != defs.RIGHT_CURLY)
            throw t.newSyntaxError("Missing ; before statement");
    }
    t.match(defs.SEMICOLON);
    return n;
}

var FunctionDefinition =
exports.FunctionDefinition =
function FunctionDefinition(t, x, requireName, functionForm) {
    var f = new Node(t);
    if (f.type != defs.FUNCTION)
        f.type = (f.value == "get") ? defs.GETTER : defs.SETTER;
    if (t.match(defs.IDENTIFIER))
        f.name = t.token.value;
    else if (requireName)
        throw t.newSyntaxError("Missing function identifier");

    t.mustMatch(defs.LEFT_PAREN);
    f.params = [];
    var tt;
    while ((tt = t.get()) != defs.RIGHT_PAREN) {
        if (tt != defs.IDENTIFIER)
            throw t.newSyntaxError("Missing formal parameter");
        f.params.push(t.token.value);
        if (t.peek() != defs.RIGHT_PAREN)
            t.mustMatch(defs.COMMA);
    }

    t.mustMatch(defs.LEFT_CURLY);
    var x2 = new CompilerContext(true);
    f.body = Script(t, x2);
    t.mustMatch(defs.RIGHT_CURLY);
    f.end = t.token.end;

    f.functionForm = functionForm;
    if (functionForm == defs.DECLARED_FORM)
        x.funDecls.push(f);
    return f;
}

var Variables = exports.Variables = function Variables(t, x) {
    var n = new Node(t);
    do {
        t.mustMatch(defs.IDENTIFIER);
        var n2 = new Node(t);
        n2.name = n2.value;
        if (t.match(defs.ASSIGN)) {
            if (t.token.assignOp)
                throw t.newSyntaxError("Invalid variable initialization");
            n2.initializer = Expression(t, x, defs.COMMA);
        }
        n2.readOnly = (n.type == defs.CONST);
        n.push(n2);
        x.varDecls.push(n2);
    } while (t.match(defs.COMMA));
    return n;
}

var ParenExpression = exports.ParenExpression = function ParenExpression(t, x) {
    t.mustMatch(defs.LEFT_PAREN);
    var n = Expression(t, x);
    t.mustMatch(defs.RIGHT_PAREN);
    return n;
}

var opPrecedence = {
    SEMICOLON: 0,
    COMMA: 1,
    ASSIGN: 2, HOOK: 2, COLON: 2,
    // The above all have to have the same precedence, see bug 330975.
    OR: 4,
    AND: 5,
    BITWISE_OR: 6,
    BITWISE_XOR: 7,
    BITWISE_AND: 8,
    EQ: 9, NE: 9, STRICT_EQ: 9, STRICT_NE: 9,
    LT: 10, LE: 10, GE: 10, GT: 10, IN: 10, INSTANCEOF: 10,
    LSH: 11, RSH: 11, URSH: 11,
    PLUS: 12, MINUS: 12,
    MUL: 13, DIV: 13, MOD: 13,
    DELETE: 14, VOID: 14, TYPEOF: 14, // PRE_INCREMENT: 14, PRE_DECREMENT: 14,
    NOT: 14, BITWISE_NOT: 14, UNARY_PLUS: 14, UNARY_MINUS: 14,
    INCREMENT: 15, DECREMENT: 15,     // postfix
    NEW: 16,
    DOT: 17
};

// Map operator type code to precedence.
for (i in opPrecedence)
    opPrecedence[defs[i]] = opPrecedence[i];

var opArity = {
    COMMA: -2,
    ASSIGN: 2,
    HOOK: 3,
    OR: 2,
    AND: 2,
    BITWISE_OR: 2,
    BITWISE_XOR: 2,
    BITWISE_AND: 2,
    EQ: 2, NE: 2, STRICT_EQ: 2, STRICT_NE: 2,
    LT: 2, LE: 2, GE: 2, GT: 2, IN: 2, INSTANCEOF: 2,
    LSH: 2, RSH: 2, URSH: 2,
    PLUS: 2, MINUS: 2,
    MUL: 2, DIV: 2, MOD: 2,
    DELETE: 1, VOID: 1, TYPEOF: 1,  // PRE_INCREMENT: 1, PRE_DECREMENT: 1,
    NOT: 1, BITWISE_NOT: 1, UNARY_PLUS: 1, UNARY_MINUS: 1,
    INCREMENT: 1, DECREMENT: 1,     // postfix
    NEW: 1, NEW_WITH_ARGS: 2, DOT: 2, INDEX: 2, CALL: 2,
    ARRAY_INIT: 1, OBJECT_INIT: 1, GROUP: 1
};

// Map operator type code to arity.
for (i in opArity)
    opArity[defs[i]] = opArity[i];

var Expression = exports.Expression = function Expression(t, x, stop) {
    var n, id, tt, operators = [], operands = [];
    var bl = x.bracketLevel, cl = x.curlyLevel, pl = x.parenLevel,
        hl = x.hookLevel;

    function reduce() {
        var n = operators.pop();
        var op = n.type;
        var arity = opArity[op];
        if (arity == -2) {
            // Flatten left-associative trees.
            var left = operands.length >= 2 && operands[operands.length-2];
            if (left.type == op) {
                var right = operands.pop();
                left.push(right);
                return left;
            }
            arity = 2;
        }

        // Always use push to add operands to n, to update start and end.
        var a = operands.splice(operands.length - arity);
        for (var i = 0; i < arity; i++)
            n.push(a[i]);

        // Include closing bracket or postfix operator in [start,end).
        if (n.end < t.token.end)
            n.end = t.token.end;

        operands.push(n);
        return n;
    }

loop:
    while ((tt = t.get()) != defs.END) {
        if (tt == stop &&
            x.bracketLevel == bl && x.curlyLevel == cl && x.parenLevel == pl &&
            x.hookLevel == hl) {
            // Stop only if tt matches the optional stop parameter, and that
            // token is not quoted by some kind of bracket.
            break;
        }
        switch (tt) {
          case defs.SEMICOLON:
            // NB: cannot be empty, Statement handled that.
            break loop;

          case defs.ASSIGN:
          case defs.HOOK:
          case defs.COLON:
            if (t.scanOperand)
                break loop;
            // Use >, not >=, for right-associative ASSIGN and HOOK/COLON.
            while (opPrecedence[top(operators).type] > opPrecedence[tt] ||
                   (tt == defs.COLON && top(operators).type == defs.ASSIGN)) {
                reduce();
            }
            if (tt == defs.COLON) {
                n = top(operators);
                if (n.type != defs.HOOK)
                    throw t.newSyntaxError("Invalid label");
                --x.hookLevel;
            } else {
                operators.push(new Node(t));
                if (tt == defs.ASSIGN)
                    top(operands).assignOp = t.token.assignOp;
                else
                    ++x.hookLevel;      // tt == HOOK
            }
            t.scanOperand = true;
            break;

          case defs.IN:
            // An in operator should not be parsed if we're parsing the head of
            // a for (...) loop, unless it is in the then part of a conditional
            // expression, or parenthesized somehow.
            if (x.inForLoopInit && !x.hookLevel &&
                !x.bracketLevel && !x.curlyLevel && !x.parenLevel) {
                break loop;
            }
            // FALL THROUGH
          case defs.COMMA:
            // Treat comma as left-associative so reduce can fold left-heavy
            // COMMA trees into a single array.
            // FALL THROUGH
          case defs.OR:
          case defs.AND:
          case defs.BITWISE_OR:
          case defs.BITWISE_XOR:
          case defs.BITWISE_AND:
          case defs.EQ: case defs.NE: case defs.STRICT_EQ: case defs.STRICT_NE:
          case defs.LT: case defs.LE: case defs.GE: case defs.GT:
          case defs.INSTANCEOF:
          case defs.LSH: case defs.RSH: case defs.URSH:
          case defs.PLUS: case defs.MINUS:
          case defs.MUL: case defs.DIV: case defs.MOD:
          case defs.DOT:
            if (t.scanOperand)
                break loop;
            while (opPrecedence[top(operators).type] >= opPrecedence[tt])
                reduce();
            if (tt == defs.DOT) {
                t.mustMatch(defs.IDENTIFIER);
                operands.push(new Node(t, defs.DOT, operands.pop(), new Node(t)));
            } else {
                operators.push(new Node(t));
                t.scanOperand = true;
            }
            break;

          case defs.DELETE:
          case defs.VOID:
          case defs.TYPEOF:
          case defs.NOT:
          case defs.BITWISE_NOT:
          case defs.UNARY_PLUS:
          case defs.UNARY_MINUS:
          case defs.NEW:
            if (!t.scanOperand)
                break loop;
            operators.push(new Node(t));
            break;

          case defs.INCREMENT:
          case defs.DECREMENT:
            if (t.scanOperand) {
                operators.push(new Node(t));  // prefix increment or decrement
            } else {
                // Don't cross a line boundary for postfix {in,de}crement.
                if (t.tokens[(t.tokenIndex + t.lookahead - 1) & 3].lineno !=
                    t.lineno) {
                    break loop;
                }

                // Use >, not >=, so postfix has higher precedence than prefix.
                while (opPrecedence[top(operators).type] > opPrecedence[tt])
                    reduce();
                n = new Node(t, tt, operands.pop());
                n.postfix = true;
                operands.push(n);
            }
            break;

          case defs.FUNCTION:
            if (!t.scanOperand)
                break loop;
            operands.push(FunctionDefinition(t, x, false, defs.EXPRESSED_FORM));
            t.scanOperand = false;
            break;

          case defs.NULL:
          case defs.THIS:
          case defs.TRUE:
          case defs.FALSE:
          case defs.IDENTIFIER:
          case defs.NUMBER:
          case defs.STRING:
          case defs.REGEXP:
            if (!t.scanOperand)
                break loop;
            operands.push(new Node(t));
            t.scanOperand = false;
            break;

          case defs.LEFT_BRACKET:
            if (t.scanOperand) {
                // Array initialiser.  Parse using recursive descent, as the
                // sub-grammar here is not an operator grammar.
                n = new Node(t, defs.ARRAY_INIT);
                while ((tt = t.peek()) != defs.RIGHT_BRACKET) {
                    if (tt == defs.COMMA) {
                        t.get();
                        n.push(null);
                        continue;
                    }
                    n.push(Expression(t, x, defs.COMMA));
                    if (!t.match(defs.COMMA))
                        break;
                }
                t.mustMatch(defs.RIGHT_BRACKET);
                operands.push(n);
                t.scanOperand = false;
            } else {
                // Property indexing operator.
                operators.push(new Node(t, defs.INDEX));
                t.scanOperand = true;
                ++x.bracketLevel;
            }
            break;

          case defs.RIGHT_BRACKET:
            if (t.scanOperand || x.bracketLevel == bl)
                break loop;
            while (reduce().type != defs.INDEX)
                continue;
            --x.bracketLevel;
            break;

          case defs.LEFT_CURLY:
            if (!t.scanOperand)
                break loop;
            // Object initialiser.  As for array initialisers (see above),
            // parse using recursive descent.
            ++x.curlyLevel;
            n = new Node(t, defs.OBJECT_INIT);
          object_init:
            if (!t.match(defs.RIGHT_CURLY)) {
                do {
                    tt = t.get();
                    if ((t.token.value == "get" || t.token.value == "set") &&
                        t.peek() == defs.IDENTIFIER) {
                        if (x.ecmaStrictMode)
                            throw t.newSyntaxError("Illegal property accessor");
                        n.push(FunctionDefinition(t, x, true, defs.EXPRESSED_FORM));
                    } else {
                        switch (tt) {
                          case defs.IDENTIFIER:
                          case defs.NUMBER:
                          case defs.STRING:
                            id = new Node(t);
                            break;
                          case defs.RIGHT_CURLY:
                            if (x.ecmaStrictMode)
                                throw t.newSyntaxError("Illegal trailing ,");
                            break object_init;
                          default:
                            throw t.newSyntaxError("Invalid property name");
                        }
                        t.mustMatch(defs.COLON);
                        n.push(new Node(t, defs.PROPERTY_INIT, id,
                                        Expression(t, x, defs.COMMA)));
                    }
                } while (t.match(defs.COMMA));
                t.mustMatch(defs.RIGHT_CURLY);
            }
            operands.push(n);
            t.scanOperand = false;
            --x.curlyLevel;
            break;

          case defs.RIGHT_CURLY:
            if (!t.scanOperand && x.curlyLevel != cl)
                throw "PANIC: right curly botch";
            break loop;

          case defs.LEFT_PAREN:
            if (t.scanOperand) {
                operators.push(new Node(t, defs.GROUP));
            } else {
                while (opPrecedence[top(operators).type] > opPrecedence[defs.NEW])
                    reduce();

                // Handle () now, to regularize the n-ary case for n > 0.
                // We must set scanOperand in case there are arguments and
                // the first one is a regexp or unary+/-.
                n = top(operators);
                t.scanOperand = true;
                if (t.match(defs.RIGHT_PAREN)) {
                    if (n.type == defs.NEW) {
                        --operators.length;
                        n.push(operands.pop());
                    } else {
                        n = new Node(t, defs.CALL, operands.pop(),
                                     new Node(t, defs.LIST));
                    }
                    operands.push(n);
                    t.scanOperand = false;
                    break;
                }
                if (n.type == defs.NEW)
                    n.type = defs.NEW_WITH_ARGS;
                else
                    operators.push(new Node(t, defs.CALL));
            }
            ++x.parenLevel;
            break;

          case defs.RIGHT_PAREN:
            if (t.scanOperand || x.parenLevel == pl)
                break loop;
            while ((tt = reduce().type) != defs.GROUP && tt != defs.CALL &&
                   tt != defs.NEW_WITH_ARGS) {
                continue;
            }
            if (tt != defs.GROUP) {
                n = top(operands);
                if (n[1].type != defs.COMMA)
                    n[1] = new Node(t, defs.LIST, n[1]);
                else
                    n[1].type = defs.LIST;
            }
            --x.parenLevel;
            break;

          // Automatic semicolon insertion means we may scan across a newline
          // and into the beginning of another statement.  If so, break out of
          // the while loop and let the t.scanOperand logic handle errors.
          default:
            break loop;
        }
    }

    if (x.hookLevel != hl)
        throw t.newSyntaxError("Missing : after ?");
    if (x.parenLevel != pl)
        throw t.newSyntaxError("Missing ) in parenthetical");
    if (x.bracketLevel != bl)
        throw t.newSyntaxError("Missing ] in index expression");
    if (t.scanOperand)
        throw t.newSyntaxError("Missing operand");

    // Resume default mode, scanning for operands, not operators.
    t.scanOperand = true;
    t.unget();
    while (operators.length)
        reduce();
    return operands.pop();
}

var parse = exports.parse = function parse(s, f, l) {
    var t = new Tokenizer(s, f, l);
    var x = new CompilerContext(false);
    var n = Script(t, x);
    if (!t.done)
        throw t.newSyntaxError("Syntax error");
    return n;
}
