import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { writeFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { compile, stages } from '../src/compiler.js';

const root = dirname(fileURLToPath(import.meta.url));
const cubescriptCli = join(root, '..', 'src', 'cubescript.js');

function runCli(args) {
  return spawnSync(process.execPath, [cubescriptCli, ...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_DISABLE_COLORS: '1',
      FORCE_COLOR: '0',
      NO_COLOR: '1',
    },
  });
}

test('compile full pipeline', () => {
  const { code, ast } = compile('let n = 1 + 2; n;');
  assert.ok(ast.optimized);
  assert.ok(code.includes('let n = 3'));
});

test('compile without optimization', () => {
  const { code } = compile('let n = 1 + 2;', { optimize: false });
  assert.ok(code.includes('let n = (1 + 2)'));
});

test('stages.parse', () => {
  const ast = stages.parse('let x = 1;');
  assert.strictEqual(ast.statements[0].name, 'x');
});

test('stages.generate returns string', () => {
  const js = stages.generate('let x = 1; x;');
  assert.ok(typeof js === 'string' && js.includes('let x'));
});

test('CLI syntax ok', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cubescript-'));
  const f = join(dir, 't.cube');
  writeFileSync(f, 'let a = 1;');
  const r = runCli(['syntax', f]);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes('syntax ok'));
  unlinkSync(f);
});

test('CLI analyze fails on undefined', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cubescript-'));
  const f = join(dir, 't.cube');
  writeFileSync(f, 'z;');
  const r = runCli(['analyze', f]);
  assert.strictEqual(r.status, 1);
  assert.ok(r.stderr.includes('Undefined'));
  unlinkSync(f);
});

test('CLI generate prints JS', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cubescript-'));
  const f = join(dir, 't.cube');
  writeFileSync(f, 'let b = 2;');
  const r = runCli(['generate', f]);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes('let b'));
  unlinkSync(f);
});

test('CLI usage on missing args', () => {
  const r = runCli([]);
  assert.strictEqual(r.status, 1);
  assert.ok(r.stderr.includes('Usage'));
});

test('CLI unknown command', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cubescript-'));
  const f = join(dir, 't.cube');
  writeFileSync(f, 'let a = 1;');
  const r = runCli(['nope', f]);
  assert.strictEqual(r.status, 1);
  unlinkSync(f);
});

test('CLI analyze ok', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cubescript-'));
  const f = join(dir, 't.cube');
  writeFileSync(f, 'let a = 1;');
  const r = runCli(['analyze', f]);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes('analysis ok'));
  unlinkSync(f);
});

test('CLI parse prints JSON', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cubescript-'));
  const f = join(dir, 't.cube');
  writeFileSync(f, 'let k = 0;');
  const r = runCli(['parse', f]);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes('"kind"'));
  unlinkSync(f);
});

test('CLI optimize prints JSON', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cubescript-'));
  const f = join(dir, 't.cube');
  writeFileSync(f, 'let u = 1 + 1;');
  const r = runCli(['optimize', f]);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes('"value": 2'));
  unlinkSync(f);
});

test('CLI run evaluates generated program', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cubescript-'));
  const f = join(dir, 't.cube');
  writeFileSync(f, 'let a = 1;');
  const r = runCli(['run', f]);
  assert.strictEqual(r.status, 0, r.stderr);
  unlinkSync(f);
});

test('CLI run prints when last statement has a value', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cubescript-'));
  const f = join(dir, 't.cube');
  writeFileSync(f, '7;');
  const r = runCli(['run', f]);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(r.stdout.trim(), '7');
  unlinkSync(f);
});

test('CLI usage when file path missing', () => {
  const r = runCli(['parse']);
  assert.strictEqual(r.status, 1);
  assert.ok(r.stderr.includes('Usage'));
});

test('CLI prints error on syntax failure', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cubescript-'));
  const f = join(dir, 't.cube');
  writeFileSync(f, 'let = 1;');
  const r = runCli(['syntax', f]);
  assert.strictEqual(r.status, 1);
  assert.ok(r.stderr.includes('CubescriptError'));
  unlinkSync(f);
});

test('CLI reports missing file cleanly', () => {
  const r = runCli(['syntax', join(tmpdir(), 'cubescript-does-not-exist-99.cube')]);
  assert.strictEqual(r.status, 1);
  assert.ok(r.stderr.includes('File not found'));
});

test('CLI runs function example', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cubescript-'));
  const f = join(dir, 't.cube');
  writeFileSync(f, 'mine double(n) { return n * 2; } let x = double(5); x;');
  const r = runCli(['run', f]);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(r.stdout.trim(), '10');
  unlinkSync(f);
});

test('CLI runs if-else example', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cubescript-'));
  const f = join(dir, 't.cube');
  writeFileSync(f, 'let x = 1; if (x > 0) { x = 99; } x;');
  const r = runCli(['run', f]);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(r.stdout.trim(), '99');
  unlinkSync(f);
});

test('CLI analyze rejects return outside function', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cubescript-'));
  const f = join(dir, 't.cube');
  writeFileSync(f, 'return 1;');
  const r = runCli(['analyze', f]);
  assert.strictEqual(r.status, 1);
  assert.ok(r.stderr.includes('Return'));
  unlinkSync(f);
});

test('CLI analyze rejects break outside loop', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cubescript-'));
  const f = join(dir, 't.cube');
  writeFileSync(f, 'break;');
  const r = runCli(['analyze', f]);
  assert.strictEqual(r.status, 1);
  assert.ok(r.stderr.includes('Break'));
  unlinkSync(f);
});

test('CLI generate emits function JS', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cubescript-'));
  const f = join(dir, 't.cube');
  writeFileSync(f, 'mine greet(name) { return "Hi " + name; }');
  const r = runCli(['generate', f]);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes('function greet'));
  unlinkSync(f);
});

test('compile full pipeline with new features', () => {
  const { code, ast } = compile('mine f(x) { return x + 1; } let r = f(4); r;');
  assert.ok(ast.optimized);
  assert.ok(code.includes('function f'));
  assert.ok(code.includes('return'));
});

test('CLI reports non-ENOENT read error', () => {
  const r = runCli(['syntax', '/']);
  assert.strictEqual(r.status, 1);
});
