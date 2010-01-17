/*
 * Narcissus - JS implemented in JS.
 *
 * Well-known constants and lookup tables.  Many consts are generated from the
 * tokens table via eval to minimize redundancy, so consumers must be compiled
 * separately to take advantage of the simple switch-case constant propagation
 * done by SpiderMonkey.
 */

// Exposed for printing token types
var tokens = exports.tokens = [
    // End of source.
    "END",

    // Operators and punctuators.  Some pair-wise order matters, e.g. (+, -)
    // and (UNARY_PLUS, UNARY_MINUS).
    "\n", ";",
    ",",
    "=",
    "?", ":", "CONDITIONAL",
    "||",
    "&&",
    "|",  // 10
    "^",
    "&",
    "==", "!=", "===", "!==",
    "<", "<=", ">=", ">",  // 17 18 19 20
    "<<", ">>", ">>>",
    "+", "-",
    "*", "/", "%",
    "!", "~", "UNARY_PLUS", "UNARY_MINUS",  // 29 30 31 32
    "++", "--",
    ".",
    "[", "]",
    "{", "}",
    "(", ")",  // 40 41

    // Nonterminal tree node type codes.
    "SCRIPT", "BLOCK", "LABEL", "FOR_IN", "CALL", "NEW_WITH_ARGS", "INDEX",
    "ARRAY_INIT", "OBJECT_INIT", "PROPERTY_INIT", "GETTER", "SETTER",
    "GROUP", "LIST",  // 54 55

    // Terminals.
    "IDENTIFIER", "NUMBER", "STRING", "REGEXP",

    // Keywords.
    "break",  // 60
    "case", "catch", "const", "continue",
    "debugger", "default", "delete", "do",
    "else", "enum",  // 69 70
    "false", "finally", "for", "function",
    "if", "in", "instanceof",
    "new", "null",
    "return",  // 80
    "switch",
    "this", "throw", "true", "try", "typeof",
    "var", "void",  // 87
    "while", "with"
];

// Operator and punctuator mapping from token to tree node type name.
// NB: superstring tokens (e.g., ++) must come before their substring token
// counterparts (+ in the example), so that the opRegExp regular expression
// synthesized from this list makes the longest possible match.
var opTypeNames = {
    '\n':   "NEWLINE",
    ';':    "SEMICOLON",
    ',':    "COMMA",
    '?':    "HOOK",
    ':':    "COLON",
    '||':   "OR",
    '&&':   "AND",
    '|':    "BITWISE_OR",
    '^':    "BITWISE_XOR",
    '&':    "BITWISE_AND",
    '===':  "STRICT_EQ",
    '==':   "EQ",
    '=':    "ASSIGN",
    '!==':  "STRICT_NE",
    '!=':   "NE",
    '<<':   "LSH",
    '<=':   "LE",
    '<':    "LT",
    '>>>':  "URSH",
    '>>':   "RSH",
    '>=':   "GE",
    '>':    "GT",
    '++':   "INCREMENT",
    '--':   "DECREMENT",
    '+':    "PLUS",
    '-':    "MINUS",
    '*':    "MUL",
    '/':    "DIV",
    '%':    "MOD",
    '!':    "NOT",
    '~':    "BITWISE_NOT",
    '.':    "DOT",
    '[':    "LEFT_BRACKET",
    ']':    "RIGHT_BRACKET",
    '{':    "LEFT_CURLY",
    '}':    "RIGHT_CURLY",
    '(':    "LEFT_PAREN",
    ')':    "RIGHT_PAREN"
};

// Hash of keyword identifier to tokens index.  NB: we must null __proto__ to
// avoid toString, etc. namespace pollution.
var keywords = {};
var defs = {};

// Define const END, etc., based on the token names.  Also map name to index.
for (var i = 0, j = tokens.length; i < j; i++) {
    var t = tokens[i],
        name;
    if (/^[a-z]/.test(t)) {
        name = t.toUpperCase();
        keywords[t] = i;
    } else {
        name = /^\W/.test(t) ? opTypeNames[t] : t
    }
    defs[name] = i;
    // Duplicate copy at top level for clients: narcissus.LEFT_BRACKET, etc.
    exports[name] = i;  
    tokens[t] = i;
}

// Map assignment operators to their indexes in the tokens array.
var tmpAssignOps = ['|', '^', '&', '<<', '>>', '>>>', '+', '-', '*', '/', '%'];
var assignOps = {};

for (i = 0, j = tmpAssignOps.length; i < j; i++) {
    var o = tmpAssignOps[i];
    assignOps[o] = tokens[o];
}
