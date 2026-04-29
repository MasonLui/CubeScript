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
  const out = analyze(ast);
  assert.strictEqual(out.analyzed, true);
});

test('analyze accepts string literals', () => {
  const ast = {
    kind: 'Program',
    statements: [{ kind: 'Let', name: 's', init: { kind: 'String', value: 'hi' } }],
  };
  analyze(ast);
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

test('analyze rejects unknown statement kind', () => {
  const ast = {
    kind: 'Program',
    statements: [{ kind: 'Nope' }],
  };
  assert.throws(() => analyze(ast), CubescriptError);
});

test('analyze rejects unknown expression kind', () => {
  const ast = {
    kind: 'Program',
    statements: [{ kind: 'Let', name: 'x', init: { kind: 'Weird' } }],
  };
  assert.throws(() => analyze(ast), CubescriptError);
});
