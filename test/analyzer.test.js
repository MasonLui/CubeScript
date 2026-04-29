import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { analyze } from '../src/analyzer.js';
import { CubescriptError } from '../src/core.js';

test('analyze accepts valid sequential lets', () => {
  const ast = {
    kind: 'Program',
    statements: [
      { kind: 'Let', name: 'a', init: { kind: 'Number', value: 1 } },
      { kind: 'Let', name: 'b', init: { kind: 'Id', name: 'a' } },
    ],
  };
  assert.strictEqual(analyze(ast).analyzed, true);
});

test('analyze accepts string literals', () => {
  const ast = {
    kind: 'Program',
    statements: [{ kind: 'Let', name: 's', init: { kind: 'String', value: 'hi' } }],
  };
  analyze(ast);
});

test('analyze accepts boolean literals', () => {
  const ast = {
    kind: 'Program',
    statements: [{ kind: 'Let', name: 'b', init: { kind: 'Boolean', value: true } }],
  };
  analyze(ast);
});

test('analyze accepts unary expression', () => {
  const ast = {
    kind: 'Program',
    statements: [
      { kind: 'Let', name: 'x', init: { kind: 'Unary', op: '-', expr: { kind: 'Number', value: 5 } } },
    ],
  };
  analyze(ast);
});

test('analyze accepts function call with known function', () => {
  const ast = {
    kind: 'Program',
    statements: [
      {
        kind: 'FuncDecl', name: 'f', params: [],
        body: [{ kind: 'Return', value: { kind: 'Number', value: 1 } }],
      },
      { kind: 'ExprStmt', expr: { kind: 'Call', name: 'f', args: [] } },
    ],
  };
  analyze(ast);
});

test('analyze accepts function declaration and return', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'FuncDecl', name: 'add', params: ['a', 'b'],
      body: [{
        kind: 'Return',
        value: { kind: 'Binary', op: '+', left: { kind: 'Id', name: 'a' }, right: { kind: 'Id', name: 'b' } },
      }],
    }],
  };
  analyze(ast);
});

test('analyze accepts if statement', () => {
  const ast = {
    kind: 'Program',
    statements: [
      { kind: 'Let', name: 'x', init: { kind: 'Number', value: 1 } },
      {
        kind: 'If',
        cond: { kind: 'Boolean', value: true },
        then: [{ kind: 'Let', name: 'y', init: { kind: 'Number', value: 2 } }],
        else: null,
      },
    ],
  };
  analyze(ast);
});

test('analyze accepts if-else statement', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'If',
      cond: { kind: 'Boolean', value: true },
      then: [{ kind: 'ExprStmt', expr: { kind: 'Number', value: 1 } }],
      else: [{ kind: 'ExprStmt', expr: { kind: 'Number', value: 2 } }],
    }],
  };
  analyze(ast);
});

test('analyze accepts while loop with break', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'While',
      cond: { kind: 'Boolean', value: true },
      body: [{ kind: 'Break' }],
    }],
  };
  analyze(ast);
});

test('analyze accepts assignment to existing variable', () => {
  const ast = {
    kind: 'Program',
    statements: [
      { kind: 'Let', name: 'x', init: { kind: 'Number', value: 1 } },
      { kind: 'Assign', name: 'x', value: { kind: 'Number', value: 2 } },
    ],
  };
  analyze(ast);
});

test('analyze accepts return with null value', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'FuncDecl', name: 'f', params: [],
      body: [{ kind: 'Return', value: null }],
    }],
  };
  analyze(ast);
});

test('analyze accepts continue inside loop', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'While',
      cond: { kind: 'Boolean', value: true },
      body: [{ kind: 'Continue' }],
    }],
  };
  analyze(ast);
});

// ── type checking ─────────────────────────────────────────────────────────────

test('analyze infers number type for let', () => {
  const ast = {
    kind: 'Program',
    statements: [{ kind: 'Let', name: 'x', init: { kind: 'Number', value: 5 } }],
  };
  analyze(ast);
});

test('analyze infers boolean type for let', () => {
  const ast = {
    kind: 'Program',
    statements: [{ kind: 'Let', name: 'b', init: { kind: 'Boolean', value: true } }],
  };
  analyze(ast);
});

test('analyze infers string type for let', () => {
  const ast = {
    kind: 'Program',
    statements: [{ kind: 'Let', name: 's', init: { kind: 'String', value: 'hi' } }],
  };
  analyze(ast);
});

test('analyze accepts arithmetic on numbers', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'Let', name: 'x',
      init: { kind: 'Binary', op: '-', left: { kind: 'Number', value: 5 }, right: { kind: 'Number', value: 2 } },
    }],
  };
  analyze(ast);
});

test('analyze accepts comparison on numbers', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'Let', name: 'b',
      init: { kind: 'Binary', op: '<', left: { kind: 'Number', value: 1 }, right: { kind: 'Number', value: 2 } },
    }],
  };
  analyze(ast);
});

test('analyze accepts logical ops on booleans', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'Let', name: 'r',
      init: { kind: 'Binary', op: '&&', left: { kind: 'Boolean', value: true }, right: { kind: 'Boolean', value: false } },
    }],
  };
  analyze(ast);
});

test('analyze accepts == on same types', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'Let', name: 'r',
      init: { kind: 'Binary', op: '===', left: { kind: 'Number', value: 1 }, right: { kind: 'Number', value: 1 } },
    }],
  };
  analyze(ast);
});

test('analyze accepts + on numbers', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'Let', name: 'r',
      init: { kind: 'Binary', op: '+', left: { kind: 'Number', value: 1 }, right: { kind: 'Number', value: 2 } },
    }],
  };
  analyze(ast);
});

test('analyze accepts + on strings', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'Let', name: 'r',
      init: { kind: 'Binary', op: '+', left: { kind: 'String', value: 'a' }, right: { kind: 'String', value: 'b' } },
    }],
  };
  analyze(ast);
});

test('analyze accepts unary not on boolean', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'Let', name: 'r',
      init: { kind: 'Unary', op: '!', expr: { kind: 'Boolean', value: true } },
    }],
  };
  analyze(ast);
});

test('analyze accepts unary neg on number', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'Let', name: 'r',
      init: { kind: 'Unary', op: '-', expr: { kind: 'Number', value: 5 } },
    }],
  };
  analyze(ast);
});

test('analyze accepts valid assignment same type', () => {
  const ast = {
    kind: 'Program',
    statements: [
      { kind: 'Let', name: 'x', init: { kind: 'Number', value: 1 } },
      { kind: 'Assign', name: 'x', value: { kind: 'Number', value: 2 } },
    ],
  };
  analyze(ast);
});

test('analyze rejects continue outside loop', () => {
  const ast = { kind: 'Program', statements: [{ kind: 'Continue' }] };
  assert.throws(() => analyze(ast), CubescriptError);
});

test('analyze rejects arithmetic on boolean', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'Let', name: 'x',
      init: { kind: 'Binary', op: '-', left: { kind: 'Boolean', value: true }, right: { kind: 'Number', value: 1 } },
    }],
  };
  assert.throws(() => analyze(ast), CubescriptError);
});

test('analyze rejects arithmetic on string', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'Let', name: 'x',
      init: { kind: 'Binary', op: '*', left: { kind: 'String', value: 'a' }, right: { kind: 'Number', value: 2 } },
    }],
  };
  assert.throws(() => analyze(ast), CubescriptError);
});

test('analyze rejects comparison on booleans', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'Let', name: 'r',
      init: { kind: 'Binary', op: '<', left: { kind: 'Boolean', value: true }, right: { kind: 'Boolean', value: false } },
    }],
  };
  assert.throws(() => analyze(ast), CubescriptError);
});

test('analyze rejects logical op on numbers', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'Let', name: 'r',
      init: { kind: 'Binary', op: '&&', left: { kind: 'Number', value: 1 }, right: { kind: 'Number', value: 2 } },
    }],
  };
  assert.throws(() => analyze(ast), CubescriptError);
});

test('analyze rejects ! on number', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'Let', name: 'r',
      init: { kind: 'Unary', op: '!', expr: { kind: 'Number', value: 1 } },
    }],
  };
  assert.throws(() => analyze(ast), CubescriptError);
});

test('analyze rejects unary neg on boolean', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'Let', name: 'r',
      init: { kind: 'Unary', op: '-', expr: { kind: 'Boolean', value: true } },
    }],
  };
  assert.throws(() => analyze(ast), CubescriptError);
});

test('analyze rejects == on mismatched types', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'Let', name: 'r',
      init: { kind: 'Binary', op: '===', left: { kind: 'Number', value: 1 }, right: { kind: 'Boolean', value: true } },
    }],
  };
  assert.throws(() => analyze(ast), CubescriptError);
});

test('analyze accepts binary op with any-typed operands returns any', () => {
  const ast = {
    kind: 'Program',
    statements: [
      { kind: 'FuncDecl', name: 'f', params: ['a', 'b'], body: [
        { kind: 'Return', value: { kind: 'Binary', op: '+', left: { kind: 'Id', name: 'a' }, right: { kind: 'Id', name: 'b' } } },
      ]},
    ],
  };
  analyze(ast);
});

test('analyze returns any for unknown binary op', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'ExprStmt',
      expr: { kind: 'Binary', op: '%', left: { kind: 'Number', value: 1 }, right: { kind: 'Number', value: 2 } },
    }],
  };
  analyze(ast);
});

test('analyze accepts unary op with unknown op returns any', () => {
  const ast = {
    kind: 'Program',
    statements: [{
      kind: 'ExprStmt',
      expr: { kind: 'Unary', op: '~', expr: { kind: 'Number', value: 5 } },
    }],
  };
  analyze(ast);
});

test('analyze rejects assignment type mismatch', () => {
  const ast = {
    kind: 'Program',
    statements: [
      { kind: 'Let', name: 'x', init: { kind: 'Number', value: 1 } },
      { kind: 'Assign', name: 'x', value: { kind: 'Boolean', value: true } },
    ],
  };
  assert.throws(() => analyze(ast), CubescriptError);
});

test('analyze rejects undefined identifier', () => {
  const ast = {
    kind: 'Program',
    statements: [{ kind: 'ExprStmt', expr: { kind: 'Id', name: 'nope' } }],
  };
  assert.throws(() => analyze(ast), CubescriptError);
});

test('analyze rejects duplicate let in same scope', () => {
  const ast = {
    kind: 'Program',
    statements: [
      { kind: 'Let', name: 'x', init: { kind: 'Number', value: 1 } },
      { kind: 'Let', name: 'x', init: { kind: 'Number', value: 2 } },
    ],
  };
  assert.throws(() => analyze(ast), CubescriptError);
});

test('analyze rejects duplicate function name', () => {
  const ast = {
    kind: 'Program',
    statements: [
      { kind: 'FuncDecl', name: 'f', params: [], body: [] },
      { kind: 'FuncDecl', name: 'f', params: [], body: [] },
    ],
  };
  assert.throws(() => analyze(ast), CubescriptError);
});

test('analyze rejects undefined function call', () => {
  const ast = {
    kind: 'Program',
    statements: [{ kind: 'ExprStmt', expr: { kind: 'Call', name: 'missing', args: [] } }],
  };
  assert.throws(() => analyze(ast), CubescriptError);
});

test('analyze rejects undefined identifier in function call arg', () => {
  const ast = {
    kind: 'Program',
    statements: [
      { kind: 'FuncDecl', name: 'f', params: ['x'], body: [] },
      { kind: 'ExprStmt', expr: { kind: 'Call', name: 'f', args: [{ kind: 'Id', name: 'nope' }] } },
    ],
  };
  assert.throws(() => analyze(ast), CubescriptError);
});

test('analyze rejects return outside function', () => {
  const ast = {
    kind: 'Program',
    statements: [{ kind: 'Return', value: null }],
  };
  assert.throws(() => analyze(ast), CubescriptError);
});

test('analyze rejects break outside loop', () => {
  const ast = {
    kind: 'Program',
    statements: [{ kind: 'Break' }],
  };
  assert.throws(() => analyze(ast), CubescriptError);
});

test('analyze rejects assignment to undefined variable', () => {
  const ast = {
    kind: 'Program',
    statements: [{ kind: 'Assign', name: 'ghost', value: { kind: 'Number', value: 1 } }],
  };
  assert.throws(() => analyze(ast), CubescriptError);
});

test('analyze rejects unknown statement kind', () => {
  const ast = { kind: 'Program', statements: [{ kind: 'Nope' }] };
  assert.throws(() => analyze(ast), CubescriptError);
});

test('analyze rejects unknown expression kind', () => {
  const ast = {
    kind: 'Program',
    statements: [{ kind: 'Let', name: 'x', init: { kind: 'Weird' } }],
  };
  assert.throws(() => analyze(ast), CubescriptError);
});
