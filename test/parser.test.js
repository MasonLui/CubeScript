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

test('parse multi-character identifier', () => {
  const ast = parse('let count = 0;');
  assert.strictEqual(ast.statements[0].name, 'count');
});

test('parse string literal', () => {
  const ast = parse('let s = "Hello";');
  assert.strictEqual(ast.statements[0].init.kind, 'String');
  assert.strictEqual(ast.statements[0].init.value, 'Hello');
});

test('parse arithmetic and parens', () => {
  const ast = parse('let x = (1 + 2) * 3;');
  const init = ast.statements[0].init;
  assert.strictEqual(init.kind, 'Binary');
  assert.strictEqual(init.op, '*');
});

test('parse subtraction and division', () => {
  const ast = parse('let x = 10 - 4; let y = 8 / 2;');
  assert.strictEqual(ast.statements[0].init.op, '-');
  assert.strictEqual(ast.statements[1].init.op, '/');
});

test('parse boolean literals', () => {
  const ast = parse('let a = true; let b = false;');
  assert.strictEqual(ast.statements[0].init.kind, 'Boolean');
  assert.strictEqual(ast.statements[0].init.value, true);
  assert.strictEqual(ast.statements[1].init.value, false);
});

test('parse comparison operators', () => {
  for (const op of ['==', '!=', '<', '>', '<=', '>=']) {
    const ast = parse(`let x = 1 ${op} 2;`);
    assert.ok(ast.statements[0].init.kind === 'Binary');
  }
});

test('parse logical operators', () => {
  const ast = parse('let x = true && false; let y = true || false;');
  assert.strictEqual(ast.statements[0].init.op, '&&');
  assert.strictEqual(ast.statements[1].init.op, '||');
});

test('parse unary not', () => {
  const ast = parse('let x = !true;');
  assert.strictEqual(ast.statements[0].init.kind, 'Unary');
  assert.strictEqual(ast.statements[0].init.op, '!');
});

test('parse unary negation', () => {
  const ast = parse('let x = -5;');
  assert.strictEqual(ast.statements[0].init.kind, 'Unary');
  assert.strictEqual(ast.statements[0].init.op, '-');
});

test('parse function declaration', () => {
  const ast = parse('mine add(a, b) { return a + b; }');
  const fn = ast.statements[0];
  assert.strictEqual(fn.kind, 'FuncDecl');
  assert.strictEqual(fn.name, 'add');
  assert.deepStrictEqual(fn.params, ['a', 'b']);
  assert.strictEqual(fn.body[0].kind, 'Return');
});

test('parse function with no params', () => {
  const ast = parse('mine greet() { return "hi"; }');
  assert.deepStrictEqual(ast.statements[0].params, []);
});

test('parse function call', () => {
  const ast = parse('add(1, 2);');
  const call = ast.statements[0].expr;
  assert.strictEqual(call.kind, 'Call');
  assert.strictEqual(call.name, 'add');
  assert.strictEqual(call.args.length, 2);
});

test('parse if statement', () => {
  const ast = parse('if (true) { let x = 1; }');
  const stmt = ast.statements[0];
  assert.strictEqual(stmt.kind, 'If');
  assert.strictEqual(stmt.else, null);
});

test('parse if-else statement', () => {
  const ast = parse('if (true) { let x = 1; } else { let y = 2; }');
  const stmt = ast.statements[0];
  assert.ok(stmt.else !== null);
  assert.strictEqual(stmt.else[0].kind, 'Let');
});

test('parse while loop', () => {
  const ast = parse('while (true) { break; }');
  assert.strictEqual(ast.statements[0].kind, 'While');
  assert.strictEqual(ast.statements[0].body[0].kind, 'Break');
});

test('parse continue statement', () => {
  const ast = parse('while (true) { continue; }');
  assert.strictEqual(ast.statements[0].body[0].kind, 'Continue');
});

test('parse return with value', () => {
  const ast = parse('mine f() { return 42; }');
  const ret = ast.statements[0].body[0];
  assert.strictEqual(ret.kind, 'Return');
  assert.strictEqual(ret.value.value, 42);
});

test('parse return without value', () => {
  const ast = parse('mine f() { return; }');
  const ret = ast.statements[0].body[0];
  assert.strictEqual(ret.value, null);
});

test('parse assignment statement', () => {
  const ast = parse('let x = 1; x = 2;');
  assert.strictEqual(ast.statements[1].kind, 'Assign');
  assert.strictEqual(ast.statements[1].name, 'x');
});

test('parse string with special chars', () => {
  const ast = parse('let s = "a b c";');
  assert.strictEqual(ast.statements[0].init.value, 'a b c');
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
