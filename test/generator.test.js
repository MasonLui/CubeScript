import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { generate } from '../src/generator.js';

test('generate emits let with number', () => {
  const ast = {
    kind: 'Program',
    statements: [{ kind: 'Let', name: 'x', init: { kind: 'Number', value: 42 } }],
  };
  assert.ok(generate(ast).includes('let x = 42'));
});

test('generate emits JSON-safe string literal', () => {
  const ast = {
    kind: 'Program',
    statements: [
      { kind: 'ExprStmt', expr: { kind: 'String', value: 'Hello, World!' } },
    ],
  };
  assert.ok(generate(ast).includes('"Hello, World!"'));
});

test('generate emits boolean literal', () => {
  const ast = {
    kind: 'Program',
    statements: [{ kind: 'Let', name: 'b', init: { kind: 'Boolean', value: true } }],
  };
  assert.ok(generate(ast).includes('let b = true'));
});

test('generate emits binary expression', () => {
  const ast = {
    kind: 'Program',
    statements: [
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
  assert.ok(generate(ast).includes('(a + 1)'));
});

test('generate emits unary not', () => {
  const ast = {
    kind: 'Program',
    statements: [
      {
        kind: 'ExprStmt',
        expr: { kind: 'Unary', op: '!', expr: { kind: 'Boolean', value: false } },
      },
    ],
  };
  assert.ok(generate(ast).includes('(!false)'));
});

test('generate emits unary negation', () => {
  const ast = {
    kind: 'Program',
    statements: [
      {
        kind: 'ExprStmt',
        expr: { kind: 'Unary', op: '-', expr: { kind: 'Number', value: 5 } },
      },
    ],
  };
  assert.ok(generate(ast).includes('(-5)'));
});

test('generate emits function call', () => {
  const ast = {
    kind: 'Program',
    statements: [
      {
        kind: 'ExprStmt',
        expr: {
          kind: 'Call',
          name: 'greet',
          args: [{ kind: 'String', value: 'Steve' }],
        },
      },
    ],
  };
  assert.ok(generate(ast).includes('greet("Steve")'));
});

test('generate emits function declaration', () => {
  const ast = {
    kind: 'Program',
    statements: [
      {
        kind: 'FuncDecl',
        name: 'add',
        params: ['a', 'b'],
        body: [
          {
            kind: 'Return',
            value: {
              kind: 'Binary',
              op: '+',
              left: { kind: 'Id', name: 'a' },
              right: { kind: 'Id', name: 'b' },
            },
          },
        ],
      },
    ],
  };
  const code = generate(ast);
  assert.ok(code.includes('function add(a, b)'));
  assert.ok(code.includes('return (a + b)'));
});

test('generate emits if without else', () => {
  const ast = {
    kind: 'Program',
    statements: [
      {
        kind: 'If',
        cond: { kind: 'Boolean', value: true },
        then: [{ kind: 'ExprStmt', expr: { kind: 'Number', value: 1 } }],
        else: null,
      },
    ],
  };
  const code = generate(ast);
  assert.ok(code.includes('if (true)'));
  assert.ok(!code.includes('else'));
});

test('generate emits if-else', () => {
  const ast = {
    kind: 'Program',
    statements: [
      {
        kind: 'If',
        cond: { kind: 'Boolean', value: true },
        then: [{ kind: 'ExprStmt', expr: { kind: 'Number', value: 1 } }],
        else: [{ kind: 'ExprStmt', expr: { kind: 'Number', value: 2 } }],
      },
    ],
  };
  const code = generate(ast);
  assert.ok(code.includes('else'));
});

test('generate emits while loop', () => {
  const ast = {
    kind: 'Program',
    statements: [
      {
        kind: 'While',
        cond: { kind: 'Boolean', value: true },
        body: [{ kind: 'Break' }],
      },
    ],
  };
  const code = generate(ast);
  assert.ok(code.includes('while (true)'));
  assert.ok(code.includes('break;'));
});

test('generate emits continue', () => {
  const ast = {
    kind: 'Program',
    statements: [
      {
        kind: 'While',
        cond: { kind: 'Boolean', value: true },
        body: [{ kind: 'Continue' }],
      },
    ],
  };
  assert.ok(generate(ast).includes('continue;'));
});

test('generate emits return with value', () => {
  const ast = {
    kind: 'Program',
    statements: [{ kind: 'Return', value: { kind: 'Number', value: 42 } }],
  };
  assert.ok(generate(ast).includes('return 42'));
});

test('generate emits return without value', () => {
  const ast = { kind: 'Program', statements: [{ kind: 'Return', value: null }] };
  assert.ok(generate(ast).includes('return;'));
});

test('generate emits assignment', () => {
  const ast = {
    kind: 'Program',
    statements: [{ kind: 'Assign', name: 'x', value: { kind: 'Number', value: 99 } }],
  };
  assert.ok(generate(ast).includes('x = 99'));
});

test('generate throws on unknown expr kind', () => {
  const ast = {
    kind: 'Program',
    statements: [{ kind: 'ExprStmt', expr: { kind: 'Weird' } }],
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

test('generate throws on unknown stmt kind', () => {
  const ast = { kind: 'Program', statements: [{ kind: 'Unknown' }] };
  assert.throws(() => generate(ast), /Cannot generate/);
});
