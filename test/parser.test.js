import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { getGrammar, loadGrammarSource, parse } from '../src/parser.js';
import { CubescriptError, formatError } from '../src/core.js';

test('loadGrammarSource returns Ohm text', () => {
  const src = loadGrammarSource();
  assert.ok(src.includes('Cubescript'));
});

test('getGrammar returns memoized grammar', () => {
  const g1 = getGrammar();
  const g2 = getGrammar();
  assert.strictEqual(g1, g2);
});

test('parse empty program', () => {
  const ast = parse('');
  assert.deepStrictEqual(ast, { kind: 'Program', statements: [] });
});

test('parse let and expression', () => {
  const ast = parse('let a = 1; a + 2;');
  assert.strictEqual(ast.statements.length, 2);
  assert.strictEqual(ast.statements[0].kind, 'Let');
  assert.strictEqual(ast.statements[0].name, 'a');
  assert.strictEqual(ast.statements[1].kind, 'ExprStmt');
});

test('parse multi-character identifier uses idChar iteration', () => {
  const ast = parse('let count = 0;');
  assert.strictEqual(ast.statements[0].name, 'count');
});

test('parse string literal', () => {
  const ast = parse('let s = "Hello";');
  assert.strictEqual(ast.statements[0].init.kind, 'String');
  assert.strictEqual(ast.statements[0].init.value, 'Hello');
});

test('parse operators and parens', () => {
  const ast = parse('let x = (1 + 2) * 3;');
  const init = ast.statements[0].init;
  assert.strictEqual(init.kind, 'Binary');
  assert.strictEqual(init.op, '*');
});

test('parse fails with CubescriptError', () => {
  assert.throws(() => parse('let = 1;'), CubescriptError);
});

test('formatError includes line and column when present', () => {
  const err = new CubescriptError('bad', { line: 2, col: 5 });
  assert.match(formatError(err), /2:5/);
});

test('formatError without line or column', () => {
  const err = new CubescriptError('oops');
  assert.ok(formatError(err).includes('oops'));
});
