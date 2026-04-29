import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { optimize } from '../src/optimizer.js';

test('optimize folds numeric addition', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'Let', name: 'x',
      init: { kind: 'Binary', op: '+', left: { kind: 'Number', value: 1 }, right: { kind: 'Number', value: 2 } },
    }],
  };
  assert.strictEqual(optimize(ast).statements[0].init.value, 3);
});

test('optimize folds numeric subtraction', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'ExprStmt',
      expr: { kind: 'Binary', op: '-', left: { kind: 'Number', value: 10 }, right: { kind: 'Number', value: 3 } },
    }],
  };
  assert.strictEqual(optimize(ast).statements[0].expr.value, 7);
});

test('optimize folds numeric multiplication', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'ExprStmt',
      expr: { kind: 'Binary', op: '*', left: { kind: 'Number', value: 3 }, right: { kind: 'Number', value: 4 } },
    }],
  };
  assert.strictEqual(optimize(ast).statements[0].expr.value, 12);
});

test('optimize folds numeric division', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'ExprStmt',
      expr: { kind: 'Binary', op: '/', left: { kind: 'Number', value: 8 }, right: { kind: 'Number', value: 2 } },
    }],
  };
  assert.strictEqual(optimize(ast).statements[0].expr.value, 4);
});

test('optimize folds numeric comparison to boolean', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'ExprStmt',
      expr: { kind: 'Binary', op: '<', left: { kind: 'Number', value: 1 }, right: { kind: 'Number', value: 2 } },
    }],
  };
  const out = optimize(ast);
  assert.strictEqual(out.statements[0].expr.kind, 'Boolean');
  assert.strictEqual(out.statements[0].expr.value, true);
});

test('optimize folds all numeric comparison ops', () => {
  for (const [op, expected] of [['>', false], ['<=', true], ['>=', false], ['===', false], ['!==', true]]) {
    const ast = {
      kind: 'Program',
      statements: [{
        kind: 'ExprStmt',
        expr: { kind: 'Binary', op, left: { kind: 'Number', value: 1 }, right: { kind: 'Number', value: 2 } },
      }],
    };
    assert.strictEqual(optimize(ast).statements[0].expr.value, expected, `op: ${op}`);
  }
});

test('optimize folds boolean && and ||', () => {
  const and = {
    kind: 'Program',
    statements: [{
      kind: 'ExprStmt',
      expr: { kind: 'Binary', op: '&&', left: { kind: 'Boolean', value: true }, right: { kind: 'Boolean', value: false } },
    }],
  };
  assert.strictEqual(optimize(and).statements[0].expr.value, false);

  const or = {
    kind: 'Program',
    statements: [{
      kind: 'ExprStmt',
      expr: { kind: 'Binary', op: '||', left: { kind: 'Boolean', value: false }, right: { kind: 'Boolean', value: true } },
    }],
  };
  assert.strictEqual(optimize(or).statements[0].expr.value, true);
});

test('optimize folds boolean === and !==', () => {
  const eq = {
    kind: 'Program',
    statements: [{
      kind: 'ExprStmt',
      expr: { kind: 'Binary', op: '===', left: { kind: 'Boolean', value: true }, right: { kind: 'Boolean', value: true } },
    }],
  };
  assert.strictEqual(optimize(eq).statements[0].expr.value, true);
});

test('optimize folds unary negation', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'ExprStmt',
      expr: { kind: 'Unary', op: '-', expr: { kind: 'Number', value: 5 } },
    }],
  };
  assert.strictEqual(optimize(ast).statements[0].expr.value, -5);
});

test('optimize folds unary not', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'ExprStmt',
      expr: { kind: 'Unary', op: '!', expr: { kind: 'Boolean', value: true } },
    }],
  };
  assert.strictEqual(optimize(ast).statements[0].expr.value, false);
});

test('optimize leaves non-constant binary', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'ExprStmt',
      expr: { kind: 'Binary', op: '+', left: { kind: 'Id', name: 'a' }, right: { kind: 'Number', value: 1 } },
    }],
  };
  assert.strictEqual(optimize(ast).statements[0].expr.kind, 'Binary');
});

test('optimize leaves non-constant unary', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'ExprStmt',
      expr: { kind: 'Unary', op: '-', expr: { kind: 'Id', name: 'x' } },
    }],
  };
  assert.strictEqual(optimize(ast).statements[0].expr.kind, 'Unary');
});

test('optimize folds args inside call', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'ExprStmt',
      expr: {
        kind: 'Call', name: 'f',
        args: [{ kind: 'Binary', op: '+', left: { kind: 'Number', value: 1 }, right: { kind: 'Number', value: 1 } }],
      },
    }],
  };
  const out = optimize(ast);
  assert.strictEqual(out.statements[0].expr.args[0].value, 2);
});

test('optimize recurses into FuncDecl body', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'FuncDecl', name: 'f', params: [],
      body: [{
        kind: 'Return',
        value: { kind: 'Binary', op: '+', left: { kind: 'Number', value: 2 }, right: { kind: 'Number', value: 3 } },
      }],
    }],
  };
  const out = optimize(ast);
  assert.strictEqual(out.statements[0].body[0].value.value, 5);
});

test('optimize recurses into If branches', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'If',
      cond: { kind: 'Boolean', value: true },
      then: [{
        kind: 'ExprStmt',
        expr: { kind: 'Binary', op: '+', left: { kind: 'Number', value: 1 }, right: { kind: 'Number', value: 1 } },
      }],
      else: [{
        kind: 'ExprStmt',
        expr: { kind: 'Binary', op: '*', left: { kind: 'Number', value: 2 }, right: { kind: 'Number', value: 2 } },
      }],
    }],
  };
  const out = optimize(ast);
  assert.strictEqual(out.statements[0].then[0].expr.value, 2);
  assert.strictEqual(out.statements[0].else[0].expr.value, 4);
});

test('optimize recurses into If with null else', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'If',
      cond: { kind: 'Boolean', value: false },
      then: [],
      else: null,
    }],
  };
  const out = optimize(ast);
  assert.strictEqual(out.statements[0].else, null);
});

test('optimize recurses into While body', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'While',
      cond: { kind: 'Boolean', value: true },
      body: [{
        kind: 'ExprStmt',
        expr: { kind: 'Binary', op: '*', left: { kind: 'Number', value: 3 }, right: { kind: 'Number', value: 3 } },
      }],
    }],
  };
  const out = optimize(ast);
  assert.strictEqual(out.statements[0].body[0].expr.value, 9);
});

test('optimize folds Assign value', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'Assign', name: 'x',
      value: { kind: 'Binary', op: '+', left: { kind: 'Number', value: 2 }, right: { kind: 'Number', value: 2 } },
    }],
  };
  assert.strictEqual(optimize(ast).statements[0].value.value, 4);
});

test('optimize Return with null value stays null', () => {
  const ast = {
    kind: 'Program',
    statements: [{ kind: 'Return', value: null }],
  };
  assert.strictEqual(optimize(ast).statements[0].value, null);
});

test('optimize passes through Break', () => {
  const ast = { kind: 'Program', statements: [{ kind: 'Break' }] };
  assert.strictEqual(optimize(ast).statements[0].kind, 'Break');
});

test('optimize passes through Continue', () => {
  const ast = { kind: 'Program', statements: [{ kind: 'Continue' }] };
  assert.strictEqual(optimize(ast).statements[0].kind, 'Continue');
});

test('optimize passes through unknown statement kinds', () => {
  const ast = { kind: 'Program', statements: [{ kind: 'FutureStmt' }] };
  assert.strictEqual(optimize(ast).statements[0].kind, 'FutureStmt');
});

test('optimize sets optimized flag', () => {
  assert.strictEqual(optimize({ kind: 'Program', statements: [] }).optimized, true);
});

test('optimize folds boolean !== to false', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'ExprStmt',
      expr: { kind: 'Binary', op: '!==', left: { kind: 'Boolean', value: true }, right: { kind: 'Boolean', value: true } },
    }],
  };
  assert.strictEqual(optimize(ast).statements[0].expr.value, false);
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
          op: '^',
          left: { kind: 'Number', value: 5 },
          right: { kind: 'Number', value: 2 },
        },
      },
    ],
  };
  const out = optimize(unknownOp);
  assert.strictEqual(out.statements[0].expr.kind, 'Binary');
  assert.strictEqual(out.statements[0].expr.op, '^');
});
