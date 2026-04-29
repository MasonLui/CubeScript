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
    LetStmt(kw, idNode, _eq, expr, _semi) {
      kw.toAst();
      return {
        kind: 'Let',
        name: idNode.sourceString,
        init: expr.toAst(),
      };
    },
    ExprStmt(expr, _semi) {
      return { kind: 'ExprStmt', expr: expr.toAst() };
    },
    Expr(e) {
      return e.toAst();
    },
    Expr_plus(left, _plus, right) {
      return { kind: 'Binary', op: '+', left: left.toAst(), right: right.toAst() };
    },
    Term(t) {
      return t.toAst();
    },
    Term_mul(left, _star, right) {
      return { kind: 'Binary', op: '*', left: left.toAst(), right: right.toAst() };
    },
    Factor(f) {
      return f.toAst();
    },
    FactorParen(_lp, expr, _rp) {
      return expr.toAst();
    },
    string(_open, chars, _close) {
      const parts = chars.toAst();
      return {
        kind: 'String',
        value: Array.isArray(parts) ? parts.join('') : '',
      };
    },
    stringChars(chars) {
      return chars.toAst();
    },
    stringChar(_any) {
      return this.sourceString;
    },
    number(_digits) {
      return { kind: 'Number', value: Number(this.sourceString) };
    },
    id(_first, rest) {
      rest.toAst();
      return { kind: 'Id', name: this.sourceString };
    },
    idChar(_c) {
      return this.sourceString;
    },
    letKeyword(_x) {
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
