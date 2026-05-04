/**
 * End-to-end integration tests — parse → analyze → optimize → generate → run.
 * Each test compiles a real Cubescript snippet and checks the generated output.
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { compile } from '../src/compiler.js';
import { parse } from '../src/parser.js';
import { analyze } from '../src/analyzer.js';
import { optimize } from '../src/optimizer.js';
import { generate } from '../src/generator.js';
import { CubescriptError } from '../src/core.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function run(source) {
  const { code } = compile(source);
  // eslint-disable-next-line no-eval
  return eval(code);
}

function jsOf(source) {
  return compile(source).code;
}

// ── arithmetic ────────────────────────────────────────────────────────────────

test('e2e: addition', () => assert.strictEqual(run('place x = 1 + 2; x;'), 3));
test('e2e: subtraction', () => assert.strictEqual(run('place x = 10 - 4; x;'), 6));
test('e2e: multiplication', () => assert.strictEqual(run('place x = 3 * 4; x;'), 12));
test('e2e: division', () => assert.strictEqual(run('place x = 8 / 2; x;'), 4));
test('e2e: operator precedence', () =>
  assert.strictEqual(run('place x = 2 + 3 * 4; x;'), 14));
test('e2e: parentheses override precedence', () =>
  assert.strictEqual(run('place x = (2 + 3) * 4; x;'), 20));
test('e2e: unary negation', () => assert.strictEqual(run('place x = -5; x;'), -5));
test('e2e: chained arithmetic', () =>
  assert.strictEqual(run('place a = 2; place b = a * 3; place c = b + 1; c;'), 7));
test('e2e: constant folding addition', () =>
  assert.ok(jsOf('place x = 1 + 2;').includes('= 3')));
test('e2e: constant folding multiplication', () =>
  assert.ok(jsOf('place x = 3 * 4;').includes('= 12')));
test('e2e: constant folding subtraction', () =>
  assert.ok(jsOf('place x = 10 - 3;').includes('= 7')));
test('e2e: constant folding division', () =>
  assert.ok(jsOf('place x = 6 / 2;').includes('= 3')));
test('e2e: constant folding nested', () =>
  assert.ok(jsOf('place x = (1 + 2) * (3 + 4);').includes('= 21')));

// ── booleans & logic ──────────────────────────────────────────────────────────

test('e2e: true literal', () => assert.strictEqual(run('true;'), true));
test('e2e: false literal', () => assert.strictEqual(run('false;'), false));
test('e2e: logical and', () =>
  assert.strictEqual(run('place x = true && false; x;'), false));
test('e2e: logical or', () =>
  assert.strictEqual(run('place x = false || true; x;'), true));
test('e2e: logical not', () => assert.strictEqual(run('place x = !true; x;'), false));
test('e2e: not false is true', () => assert.strictEqual(run('!false;'), true));
test('e2e: constant folding && true true', () =>
  assert.ok(jsOf('place x = true && true;').includes('= true')));
test('e2e: constant folding || false false', () =>
  assert.ok(jsOf('place x = false || false;').includes('= false')));
test('e2e: constant folding ! true', () =>
  assert.ok(jsOf('place x = !true;').includes('= false')));

// ── comparisons ───────────────────────────────────────────────────────────────

test('e2e: less than true', () => assert.strictEqual(run('1 < 2;'), true));
test('e2e: less than false', () => assert.strictEqual(run('2 < 1;'), false));
test('e2e: greater than', () => assert.strictEqual(run('3 > 2;'), true));
test('e2e: less or equal', () => assert.strictEqual(run('2 <= 2;'), true));
test('e2e: greater or equal', () => assert.strictEqual(run('3 >= 4;'), false));
test('e2e: equality true', () => assert.strictEqual(run('1 == 1;'), true));
test('e2e: equality false', () => assert.strictEqual(run('1 == 2;'), false));
test('e2e: inequality true', () => assert.strictEqual(run('1 != 2;'), true));
test('e2e: constant folding comparison', () =>
  assert.ok(jsOf('place x = 1 < 2;').includes('= true')));

// ── strings ───────────────────────────────────────────────────────────────────

test('e2e: string literal', () =>
  assert.strictEqual(run('place s = "hello"; s;'), 'hello'));
test('e2e: string concatenation', () =>
  assert.strictEqual(run('place s = "hello" + " world"; s;'), 'hello world'));
test('e2e: empty string', () => assert.strictEqual(run('place s = ""; s;'), ''));

// ── variables ─────────────────────────────────────────────────────────────────

test('e2e: place and read', () => assert.strictEqual(run('place x = 42; x;'), 42));
test('e2e: assignment updates value', () =>
  assert.strictEqual(run('place x = 1; x = 99; x;'), 99));
test('e2e: multiple variables', () =>
  assert.strictEqual(run('place a = 1; place b = 2; a + b;'), 3));

// ── functions ─────────────────────────────────────────────────────────────────

test('e2e: function returns value', () =>
  assert.strictEqual(run('mine f() { return 42; } f();'), 42));
test('e2e: function with params', () =>
  assert.strictEqual(run('mine add(a, b) { return a + b; } add(3, 4);'), 7));
test('e2e: function with multiple params', () =>
  assert.strictEqual(run('mine sum3(a,b,c) { return a+b+c; } sum3(1,2,3);'), 6));
test('e2e: recursive-style function', () =>
  assert.strictEqual(
    run('mine double(n) { return n * 2; } place r = double(double(3)); r;'),
    12
  ));
test('e2e: function call in expression', () =>
  assert.strictEqual(run('mine inc(n) { return n + 1; } inc(5) + inc(6);'), 13));
test('e2e: function uses outer let', () =>
  assert.strictEqual(run('mine id(x) { return x; } place r = id(77); r;'), 77));
test('e2e: generated code has function keyword', () =>
  assert.ok(jsOf('mine f(x) { return x; }').includes('function f')));
test('e2e: return without value', () => {
  assert.doesNotThrow(() => compile('mine f() { return; }'));
});

// ── if / else ─────────────────────────────────────────────────────────────────

test('e2e: if true branch taken', () =>
  assert.strictEqual(run('place x = 0; if (true) { x = 1; } x;'), 1));
test('e2e: if false branch not taken', () =>
  assert.strictEqual(run('place x = 0; if (false) { x = 1; } x;'), 0));
test('e2e: if-else true', () =>
  assert.strictEqual(run('place x = 0; if (true) { x = 1; } else { x = 2; } x;'), 1));
test('e2e: if-else false', () =>
  assert.strictEqual(run('place x = 0; if (false) { x = 1; } else { x = 2; } x;'), 2));
test('e2e: if with comparison', () =>
  assert.strictEqual(run('place x = 5; place r = 0; if (x > 3) { r = 1; } r;'), 1));
test('e2e: nested if', () =>
  assert.strictEqual(
    run('place x = 10; place r = 0; if (x > 5) { if (x > 8) { r = 2; } } r;'),
    2
  ));

// ── while / break / continue ──────────────────────────────────────────────────

test('e2e: while loop runs', () =>
  assert.strictEqual(run('place i = 0; while (i < 3) { i = i + 1; } i;'), 3));
test('e2e: while loop does not run if false', () =>
  assert.strictEqual(run('place i = 5; while (false) { i = 0; } i;'), 5));
test('e2e: break exits loop', () =>
  assert.strictEqual(
    run('place i = 0; while (true) { i = i + 1; if (i == 3) { break; } } i;'),
    3
  ));
test('e2e: continue skips rest of body', () =>
  assert.strictEqual(
    run(
      'place s = 0; place i = 0; while (i < 5) { i = i + 1; if (i == 3) { continue; } s = s + i; } s;'
    ),
    12
  ));
test('e2e: generated while has while keyword', () =>
  assert.ok(jsOf('while (true) { break; }').includes('while')));
test('e2e: generated break has break keyword', () =>
  assert.ok(jsOf('while (true) { break; }').includes('break')));
test('e2e: generated continue has continue keyword', () =>
  assert.ok(jsOf('while (true) { continue; }').includes('continue')));

// ── type errors (compile-time) ────────────────────────────────────────────────

test('e2e: rejects arithmetic on boolean', () =>
  assert.throws(() => compile('true - 1;'), CubescriptError));
test('e2e: rejects arithmetic on string', () =>
  assert.throws(() => compile('"a" * 2;'), CubescriptError));
test('e2e: rejects logical op on number', () =>
  assert.throws(() => compile('1 && 2;'), CubescriptError));
test('e2e: rejects ! on number', () =>
  assert.throws(() => compile('!1;'), CubescriptError));
test('e2e: rejects unary neg on boolean', () =>
  assert.throws(() => compile('-true;'), CubescriptError));
test('e2e: rejects comparison on booleans', () =>
  assert.throws(() => compile('true < false;'), CubescriptError));
test('e2e: rejects == on mixed types', () =>
  assert.throws(() => compile('1 == true;'), CubescriptError));
test('e2e: rejects assignment type mismatch', () =>
  assert.throws(() => compile('place x = 1; x = true;'), CubescriptError));
test('e2e: rejects undefined identifier', () =>
  assert.throws(() => compile('ghost;'), CubescriptError));
test('e2e: rejects duplicate binding', () =>
  assert.throws(() => compile('place x = 1; place x = 2;'), CubescriptError));
test('e2e: rejects return outside function', () =>
  assert.throws(() => compile('return 1;'), CubescriptError));
test('e2e: rejects break outside loop', () =>
  assert.throws(() => compile('break;'), CubescriptError));
test('e2e: rejects continue outside loop', () =>
  assert.throws(() => compile('continue;'), CubescriptError));
test('e2e: rejects syntax error', () =>
  assert.throws(() => compile('place = 1;'), CubescriptError));

// ── pipeline stages ───────────────────────────────────────────────────────────

test('e2e: parse produces Program node', () =>
  assert.strictEqual(parse('place x = 1;').kind, 'Program'));
test('e2e: analyze returns analyzed flag', () =>
  assert.strictEqual(analyze(parse('place x = 1;')).analyzed, true));
test('e2e: optimize returns optimized flag', () =>
  assert.strictEqual(optimize(analyze(parse('place x = 1;'))).optimized, true));
test('e2e: generate returns string', () =>
  assert.strictEqual(
    typeof generate(optimize(analyze(parse('place x = 1;')))),
    'string'
  ));
test('e2e: compile without optimize skips folding', () => {
  const { code } = compile('place x = 1 + 2;', { optimize: false });
  assert.ok(code.includes('(1 + 2)'));
});
