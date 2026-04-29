import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { generate } from '../src/generator.js';

test('generate emits JSON-safe string literal', () => {
  const ast = {
    kind: 'Program',
    statements: [
      {
        kind: 'ExprStmt',
        expr: { kind: 'String', value: 'Hello, World!' },
      },
    ],
  };
  assert.ok(generate(ast).includes('"Hello, World!"'));
});

test('generate emits let and expression', () => {
  const ast = {
    kind: 'Program',
    statements: [
      { kind: 'Let', name: 'a', init: { kind: 'Number', value: 2 } },
      {
        kind: 'ExprStmt',
        expr: {
          kind: 'Binary',
          op: '+',
          left: { kind: 'Id', name: 'a' },
          right: { kind: 'Number', value: 1 },
        },
      },
    ],
  };
  const js = generate(ast);
  assert.ok(js.includes('let a = 2'));
  assert.ok(js.includes('(a + 1)'));
});

test('generate throws on unknown expr kind', () => {
  const ast = {
    kind: 'Program',
    statements: [
      {
        kind: 'ExprStmt',
        expr: { kind: 'Weird' },
      },
    ],
  };
  assert.throws(() => generate(ast), /Cannot generate/);
});

test('generate emits multiple lines for multiple statements', () => {
  const ast = {
    kind: 'Program',
    statements: [
      { kind: 'Let', name: 'x', init: { kind: 'Number', value: 1 } },
      { kind: 'ExprStmt', expr: { kind: 'Id', name: 'x' } },
    ],
  };
  const js = generate(ast);
  assert.strictEqual(js.split('\n').length, 2);
});

test('generate preserves operator order with parentheses', () => {
  const ast = {
    kind: 'Program',
    statements: [
      {
        kind: 'ExprStmt',
        expr: {
          kind: 'Binary',
          op: '*',
          left: {
            kind: 'Binary',
            op: '+',
            left: { kind: 'Number', value: 1 },
            right: { kind: 'Number', value: 2 },
          },
          right: { kind: 'Number', value: 3 },
        },
      },
    ],
  };
  const js = generate(ast);
  assert.ok(js.includes('((1 + 2) * 3);'));
});
