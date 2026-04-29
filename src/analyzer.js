import { CubescriptError } from './core.js';

// Types: 'number' | 'boolean' | 'string' | 'any'
// env maps variable/function name → type

function requireType(op, expected, actual, errors) {
  if (actual !== 'any' && actual !== expected) {
    errors.push(
      new CubescriptError(`Type error: '${op}' requires ${expected} but got ${actual}`)
    );
  }
}

function walkExpr(expr, env, ctx, errors) {
  switch (expr.kind) {
    case 'Number':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'String':
      return 'string';
    case 'Id':
      if (!env.has(expr.name)) {
        errors.push(new CubescriptError(`Undefined identifier '${expr.name}'`));
        return 'any';
      }
      return env.get(expr.name);
    case 'Binary': {
      const lt = walkExpr(expr.left, env, ctx, errors);
      const rt = walkExpr(expr.right, env, ctx, errors);
      if (expr.op === '+') {
        if (lt === 'number' && rt === 'number') return 'number';
        if (lt === 'string' || rt === 'string') return 'string';
        return 'any';
      }
      if (['-', '*', '/'].includes(expr.op)) {
        requireType(expr.op, 'number', lt, errors);
        requireType(expr.op, 'number', rt, errors);
        return 'number';
      }
      if (['<', '>', '<=', '>='].includes(expr.op)) {
        requireType(expr.op, 'number', lt, errors);
        requireType(expr.op, 'number', rt, errors);
        return 'boolean';
      }
      if (['&&', '||'].includes(expr.op)) {
        requireType(expr.op, 'boolean', lt, errors);
        requireType(expr.op, 'boolean', rt, errors);
        return 'boolean';
      }
      if (['===', '!=='].includes(expr.op)) {
        if (lt !== 'any' && rt !== 'any' && lt !== rt) {
          errors.push(
            new CubescriptError(`Type error: cannot compare ${lt} with ${rt}`)
          );
        }
        return 'boolean';
      }
      return 'any';
    }
    case 'Unary': {
      const t = walkExpr(expr.expr, env, ctx, errors);
      if (expr.op === '!') {
        requireType('!', 'boolean', t, errors);
        return 'boolean';
      }
      if (expr.op === '-') {
        requireType('-', 'number', t, errors);
        return 'number';
      }
      return 'any';
    }
    case 'Call': {
      if (!env.has(expr.name)) {
        errors.push(new CubescriptError(`Undefined function '${expr.name}'`));
      }
      for (const arg of expr.args) {
        walkExpr(arg, env, ctx, errors);
      }
      return 'any';
    }
    default:
      errors.push(new CubescriptError(`Unknown expression kind: ${expr.kind}`));
      return 'any';
  }
}

function walkStmts(stmts, env, ctx, errors) {
  for (const stmt of stmts) {
    walkStmt(stmt, env, ctx, errors);
  }
}

function walkStmt(stmt, env, ctx, errors) {
  switch (stmt.kind) {
    case 'Let': {
      if (env.has(stmt.name)) {
        errors.push(
          new CubescriptError(`Duplicate binding '${stmt.name}' in the same scope`)
        );
      }
      const t = walkExpr(stmt.init, env, ctx, errors);
      env.set(stmt.name, t);
      break;
    }
    case 'Assign': {
      if (!env.has(stmt.name)) {
        errors.push(new CubescriptError(`Undefined identifier '${stmt.name}'`));
        break;
      }
      const declared = env.get(stmt.name);
      const assigned = walkExpr(stmt.value, env, ctx, errors);
      if (declared !== 'any' && assigned !== 'any' && declared !== assigned) {
        errors.push(
          new CubescriptError(
            `Type error: cannot assign ${assigned} to '${stmt.name}' (declared ${declared})`
          )
        );
      }
      break;
    }
    case 'ExprStmt':
      walkExpr(stmt.expr, env, ctx, errors);
      break;
    case 'FuncDecl': {
      if (env.has(stmt.name)) {
        errors.push(
          new CubescriptError(`Duplicate binding '${stmt.name}' in the same scope`)
        );
      }
      env.set(stmt.name, 'any');
      const funcEnv = new Map(env);
      for (const p of stmt.params) {
        funcEnv.set(p, 'any');
      }
      walkStmts(stmt.body, funcEnv, { ...ctx, inFunction: true }, errors);
      break;
    }
    case 'If':
      walkExpr(stmt.cond, env, ctx, errors);
      walkStmts(stmt.then, new Map(env), ctx, errors);
      if (stmt.else) {
        walkStmts(stmt.else, new Map(env), ctx, errors);
      }
      break;
    case 'While':
      walkExpr(stmt.cond, env, ctx, errors);
      walkStmts(stmt.body, new Map(env), { ...ctx, inLoop: true }, errors);
      break;
    case 'Return':
      if (!ctx.inFunction) {
        errors.push(new CubescriptError('Return statement outside of a function'));
      }
      if (stmt.value) {
        walkExpr(stmt.value, env, ctx, errors);
      }
      break;
    case 'Break':
      if (!ctx.inLoop) {
        errors.push(new CubescriptError('Break statement outside of a loop'));
      }
      break;
    case 'Continue':
      if (!ctx.inLoop) {
        errors.push(new CubescriptError('Continue statement outside of a loop'));
      }
      break;
    default:
      errors.push(new CubescriptError(`Unknown statement kind: ${stmt.kind}`));
  }
}

export function analyze(ast) {
  const env = new Map();
  const ctx = { inFunction: false, inLoop: false };
  const errors = [];
  walkStmts(ast.statements, env, ctx, errors);
  if (errors.length) {
    throw errors[0];
  }
  return { ...ast, analyzed: true };
}
