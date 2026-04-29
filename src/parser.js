import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ohm from 'ohm-js';
import { CubescriptError } from './core.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let cachedGrammar;

export function loadGrammarSource() {
  return readFileSync(join(__dirname, 'cubescript.ohm'), 'utf8');
}

export function getGrammar() {
  if (!cachedGrammar) {
    cachedGrammar = ohm.grammar(loadGrammarSource());
  }
  return cachedGrammar;
}

function buildSemantics(g) {
  return g.createSemantics().addOperation('toAst', {
    _iter(...children) {
      return children.map((c) => c.toAst());
    },
    Prog(stmts) {
      return { kind: 'Program', statements: stmts.toAst() };
    },
    Stmt(s) {
      return s.toAst();
    },

    // ── declarations ──────────────────────────────────────────
    FuncDecl(_mine, idNode, _lp, params, _rp, block) {
      return {
        kind: 'FuncDecl',
        name: idNode.sourceString,
        params: params.toAst(),
        body: block.toAst(),
      };
    },
    Params(list) {
      return list.asIteration().children.map((c) => c.sourceString);
    },
    Block(_lb, stmts, _rb) {
      return stmts.toAst();
    },

    // ── control flow ──────────────────────────────────────────
    IfStmt(_if, _lp, cond, _rp, thenBlock, elseKw, elseBlock) {
      return {
        kind: 'If',
        cond: cond.toAst(),
        then: thenBlock.toAst(),
        else: elseBlock.children.length > 0 ? elseBlock.children[0].toAst() : null,
      };
    },
    WhileStmt(_while, _lp, cond, _rp, body) {
      return { kind: 'While', cond: cond.toAst(), body: body.toAst() };
    },
    ReturnStmt(_ret, expr, _semi) {
      return {
        kind: 'Return',
        value: expr.children.length > 0 ? expr.children[0].toAst() : null,
      };
    },
    BreakStmt(_break, _semi) {
      return { kind: 'Break' };
    },
    ContinueStmt(_continue, _semi) {
      return { kind: 'Continue' };
    },

    // ── variable statements ───────────────────────────────────
    LetStmt(_let, idNode, _eq, expr, _semi) {
      return { kind: 'Let', name: idNode.sourceString, init: expr.toAst() };
    },
    AssignStmt(idNode, _eq, expr, _semi) {
      return { kind: 'Assign', name: idNode.sourceString, value: expr.toAst() };
    },
    ExprStmt(expr, _semi) {
      return { kind: 'ExprStmt', expr: expr.toAst() };
    },

    // ── expressions ───────────────────────────────────────────
    Expr(e) {
      return e.toAst();
    },
    Expr_or(left, _op, right) {
      return { kind: 'Binary', op: '||', left: left.toAst(), right: right.toAst() };
    },
    Expr2(e) {
      return e.toAst();
    },
    Expr2_and(left, _op, right) {
      return { kind: 'Binary', op: '&&', left: left.toAst(), right: right.toAst() };
    },
    Expr3(e) {
      return e.toAst();
    },
    Expr3_eq(left, _op, right) {
      return { kind: 'Binary', op: '===', left: left.toAst(), right: right.toAst() };
    },
    Expr3_ne(left, _op, right) {
      return { kind: 'Binary', op: '!==', left: left.toAst(), right: right.toAst() };
    },
    Expr3_le(left, _op, right) {
      return { kind: 'Binary', op: '<=', left: left.toAst(), right: right.toAst() };
    },
    Expr3_ge(left, _op, right) {
      return { kind: 'Binary', op: '>=', left: left.toAst(), right: right.toAst() };
    },
    Expr3_lt(left, _op, right) {
      return { kind: 'Binary', op: '<', left: left.toAst(), right: right.toAst() };
    },
    Expr3_gt(left, _op, right) {
      return { kind: 'Binary', op: '>', left: left.toAst(), right: right.toAst() };
    },
    Expr4(e) {
      return e.toAst();
    },
    Expr4_plus(left, _op, right) {
      return { kind: 'Binary', op: '+', left: left.toAst(), right: right.toAst() };
    },
    Expr4_minus(left, _op, right) {
      return { kind: 'Binary', op: '-', left: left.toAst(), right: right.toAst() };
    },
    Expr5(e) {
      return e.toAst();
    },
    Expr5_mul(left, _op, right) {
      return { kind: 'Binary', op: '*', left: left.toAst(), right: right.toAst() };
    },
    Expr5_div(left, _op, right) {
      return { kind: 'Binary', op: '/', left: left.toAst(), right: right.toAst() };
    },
    Unary(u) {
      return u.toAst();
    },
    Unary_not(_bang, expr) {
      return { kind: 'Unary', op: '!', expr: expr.toAst() };
    },
    Unary_neg(_minus, expr) {
      return { kind: 'Unary', op: '-', expr: expr.toAst() };
    },
    Call(c) {
      return c.toAst();
    },
    Call_call(idNode, _lp, args, _rp) {
      return { kind: 'Call', name: idNode.sourceString, args: args.toAst() };
    },
    Args(list) {
      return list.asIteration().children.map((c) => c.toAst());
    },
    Primary(p) {
      return p.toAst();
    },
    Primary_paren(_lp, expr, _rp) {
      return expr.toAst();
    },

    // ── literals ──────────────────────────────────────────────
    boolLit(node) {
      return { kind: 'Boolean', value: node.sourceString === 'true' };
    },
    string(_open, chars, _close) {
      return {
        kind: 'String',
        value: chars.children.map((c) => c.sourceString).join(''),
      };
    },
    stringChar(_any) {
      return this.sourceString;
    },
    number(_digits) {
      return { kind: 'Number', value: Number(this.sourceString) };
    },
    id(_first, _rest) {
      return { kind: 'Id', name: this.sourceString };
    },

    // ── keywords (no AST value needed) ───────────────────────
    letKeyword(_x) {
      return undefined;
    },
    mineKeyword(_x) {
      return undefined;
    },
    ifKeyword(_x) {
      return undefined;
    },
    elseKeyword(_x) {
      return undefined;
    },
    whileKeyword(_x) {
      return undefined;
    },
    returnKeyword(_x) {
      return undefined;
    },
    breakKeyword(_x) {
      return undefined;
    },
    continueKeyword(_x) {
      return undefined;
    },
    trueKeyword(_x) {
      return undefined;
    },
    falseKeyword(_x) {
      return undefined;
    },
  });
}

export function parse(source, { grammar = getGrammar() } = {}) {
  const m = grammar.match(source);
  if (m.failed()) {
    const pos = m.getRightmostFailurePosition();
    const line = source.slice(0, pos).split('\n').length;
    const col = pos - source.lastIndexOf('\n', pos - 1);
    throw new CubescriptError(m.message, { line, col });
  }
  const sem = buildSemantics(grammar);
  return sem(m).toAst();
}
