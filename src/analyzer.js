import { CubescriptError } from './core.js';

function walkExpr(expr, env, ctx, errors) {
  switch (expr.kind) {
    case 'Number':
    case 'String':
    case 'Boolean':
      return;
    case 'Id':
      if (!env.has(expr.name)) {
        errors.push(new CubescriptError(`Undefined identifier '${expr.name}'`));
      }
      return;
    case 'Binary':
      walkExpr(expr.left, env, ctx, errors);
      walkExpr(expr.right, env, ctx, errors);
      return;
    case 'Unary':
      walkExpr(expr.expr, env, ctx, errors);
      return;
    case 'Call': {
      if (!env.has(expr.name)) {
        errors.push(new CubescriptError(`Undefined function '${expr.name}'`));
      }
      for (const arg of expr.args) {
        walkExpr(arg, env, ctx, errors);
      }
      return;
    }
    default:
      errors.push(new CubescriptError(`Unknown expression kind: ${expr.kind}`));
  }
}

function walkStmts(stmts, env, ctx, errors) {
  for (const stmt of stmts) {
    walkStmt(stmt, env, ctx, errors);
  }
}

function walkStmt(stmt, env, ctx, errors) {
  switch (stmt.kind) {
    case 'Let':
      if (env.has(stmt.name)) {
        errors.push(new CubescriptError(`Duplicate binding '${stmt.name}' in the same scope`));
      }
      walkExpr(stmt.init, env, ctx, errors);
      env.set(stmt.name, true);
      break;
    case 'Assign':
      if (!env.has(stmt.name)) {
        errors.push(new CubescriptError(`Undefined identifier '${stmt.name}'`));
      }
      walkExpr(stmt.value, env, ctx, errors);
      break;
    case 'ExprStmt':
      walkExpr(stmt.expr, env, ctx, errors);
      break;
    case 'FuncDecl': {
      if (env.has(stmt.name)) {
        errors.push(new CubescriptError(`Duplicate binding '${stmt.name}' in the same scope`));
      }
      env.set(stmt.name, true);
      const funcEnv = new Map(env);
      for (const p of stmt.params) {
        funcEnv.set(p, true);
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
