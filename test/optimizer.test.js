import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { optimize } from '../src/optimizer.js';

const ast = {
  kind: 'Program',
  statements: [
    {
      kind: 'Let',
      name: 'x',
      init: {
        kind: 'Binary',
        op: '+',
        left: { kind: 'Number', value: 1 },
        right: { kind: 'Number', value: 2 },
      },
    },
    {
      kind: 'ExprStmt',
      expr: {
        kind: 'Binary',
        op: '*',
        left: { kind: 'Number', value: 3 },
        right: { kind: 'Number', value: 4 },
      },
    },
  ],
};

test('optimize folds numeric binops', () => {
  const out = optimize(ast);
  assert.strictEqual(out.optimized, true);
  assert.strictEqual(out.statements[0].init.value, 3);
  assert.strictEqual(out.statements[1].expr.value, 12);
});

test('optimize leaves non-constant expressions', () => {
  const withId = {
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
  const out = optimize(withId);
  assert.strictEqual(out.statements[0].expr.kind, 'Binary');
});

test('optimize passes through unknown statement kinds', () => {
  const weird = {
    kind: 'Program',
    statements: [{ kind: 'FutureStmt' }],
  };
  const out = optimize(weird);
  assert.strictEqual(out.statements[0].kind, 'FutureStmt');
});

test('optimize folds nested expressions recursively', () => {
  const nested = {
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
          right: { kind: 'Number', value: 5 },
        },
      },
    ],
  };
  const out = optimize(nested);
  assert.deepStrictEqual(out.statements[0].expr, { kind: 'Number', value: 15 });
});

test('optimize does not fold unknown operators', () => {
  const unknownOp = {
    kind: 'Program',
    statements: [
      {
        kind: 'ExprStmt',
        expr: {
          kind: 'Binary',
          op: '-',
          left: { kind: 'Number', value: 5 },
          right: { kind: 'Number', value: 2 },
        },
      },
    ],
  };
  const out = optimize(unknownOp);
  assert.strictEqual(out.statements[0].expr.kind, 'Binary');
  assert.strictEqual(out.statements[0].expr.op, '-');
});
