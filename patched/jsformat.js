
var lookup = function () {
};

exports.format = function (node, scope, root) {
    switch (node.type) {

    case defs.SCRIPT:
        node.parent = scope;
        var accumulator = '';
        if (node.varDecls.length) {
            accumulator += 'var ';
            for (var i = 0; i < node.varDecls.length; i++) {
                accumulator += node.varDecls[i].name;
                if (i != node.varDecls.length - 1)
                    accumulator += ',';
            }
            accumulator += ';';
        }
        for (var i = 0; i < node.length; i++) {
            accumulator += exports.format(node[i], node);
            if (
                (
                    node[i].type == defs.SEMICOLON ||
                    node[i].type == defs.RETURN ||
                    node[i].type == defs.VAR
                ) &&
                i < node.length - 1
            )
                accumulator += ';';
        }
        return accumulator;

    case defs.VAR:
        var accumulator = '';
        for (var i = 0; i < node.length; i++) {
            accumulator += node[i].name + '=' + exports.format(node[i].initializer);
            if (i != node.length - 1) accumulator += ';';
        }
        return accumulator;

    case defs.DOT:
        if (node[0].type == defs.NUMBER && node[0].toString().indexOf('.') < 0)
            return exports.format(node[0]) + '..' + exports.format(node[1]);
        return exports.format(node[0]) + '.' + exports.format(node[1]);

    case defs.INDEX:
        if (node[1].type == defs.STRING) {
        }
        return exports.format(node[0]) + '[' + exports.format(node[1]) + ']';

    case defs.FUNCTION:
        var accumulator = 'function';
        if (node.name) accumulator += ' ' + name;
        accumulator += '(' + node.params.join(',') + ')';
        accumulator += '{' + exports.format(node.body) + '}';
        return accumulator;

    case defs.RETURN:
        return 'return ' + exports.format(node.value);

    case defs.CALL:
        return exports.format(node[0]) + '(' + exports.format(node[1]) + ')';

    case defs.IF:
        var accumulator = 'if(' + exports.format(node.condition) + ')';
        accumulator += '{' + exports.format(node.thenPart) + '}';
        if (node.elsePart) {
            accumulator += 'else{' + exports.format(node.elsePart) + '}';
        }
        return accumulator;

    case defs.BLOCK:
        var accumulator = '{';
        for (var i = 0; i < node.length; i++) {
            accumulator += exports.format(node[i]);
            if (node[i].type == defs.SEMICOLON && i < node.length - 1)
                accumulator += ';';
        }
        accumulator += '}';
        return accumulator;

    case defs.GROUP:
        var accumulator = '(';
        for (var i = 0; i < node.length; i++) {
            accumulator += exports.format(node[i]);
            if (node[i].type == defs.SEMICOLON && i < node.length - 1)
                accumulator += ',';
        }
        accumulator += ')';
        return accumulator;

    case defs.LIST:
    case defs.COMMA:
        var accumulator = '';
        for (var i = 0; i < node.length; i++) {
            accumulator += exports.format(node[i]);
            if (i < node.length - 1)
                accumulator += ',';
        }
        return accumulator;

    case defs.ARRAY_INIT:
        break;
    case defs.OBJECT_INIT:
        break;
    case defs.PROPERTY_INIT:
        break;

    case defs.LABEL:
        break;
    case defs.FOR_IN:
        break;
    case defs.NEW_WITH_ARGS:
        break;

    case defs.GETTER:
        break;
    case defs.SETTER:
        break;

    case defs.NEWLINE:
        return '';
    case defs.SEMICOLON:
        return exports.format(node.expression);

    case defs.HOOK:
        break;

    case defs.COLON:
        break;

    case defs.ASSIGN:
        if (node.value != '=')
            return exports.format(node[0]) + node.value + '=' + exports.format(node[1]);
        else
            return exports.format(node[0]) + '=' + exports.format(node[1]);

    case defs.INCREMENT:
    case defs.DECREMENT:
        break;

    case defs.STRICT_NE:
    case defs.NE:
    case defs.LSH:
    case defs.LE:
    case defs.LT:
    case defs.URSH:
    case defs.RSH:
    case defs.GE:
    case defs.GT:
    case defs.OR:
    case defs.AND:
    case defs.BITWISE_OR:
    case defs.BITWISE_XOR:
    case defs.BITWISE_AND:
    case defs.STRICT_EQ:
    case defs.EQ:
    case defs.PLUS:
    case defs.MINUS:
    case defs.MUL:
    case defs.DIV:
    case defs.MOD:
        return exports.format(node[0]) + node.value + exports.format(node[1]);

    case defs.UNARY_MINUS:
    case defs.UNARY_PLUS:
    case defs.NOT:
    case defs.BITWISE_NOT:
        return node.value + exports.format(node[0]);

    case defs.IDENTIFIER:
        return node.value;

    case defs.STRING:
        // TODO: Proper formatting
        return '"' + node.value + '"';
    case defs.REGEXP:
        return node.value;
    case defs.TRUE:
    case defs.FALSE:
    case defs.NULL:
    case defs.UNDEFINED:
    case defs.NUMBER:
        return node.value;
    default:
        return '';
        //throw new SyntaxError(node);

    }
};

