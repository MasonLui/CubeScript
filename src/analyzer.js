import { CubescriptError } from './core.js';

function walkExpr(expr, env, errors) {
  switch (expr.kind) {
    case 'Number':
      return;
    case 'String':
      return;
    case 'Id': {
      if (!env.has(expr.name)) {
        errors.push(new CubescriptError(`Undefined identifier '${expr.name}'`));
      }
      return;
    }
    case 'Binary':
      walkExpr(expr.left, env, errors);
      walkExpr(expr.right, env, errors);
      return;
    default:
      errors.push(new CubescriptError(`Unknown expression kind: ${expr.kind}`));
  }
}

export function analyze(ast) {
  const env = new Map();
  const errors = [];

  for (const stmt of ast.statements) {
    if (stmt.kind === 'Let') {
      if (env.has(stmt.name)) {
        errors.push(
          new CubescriptError(`Duplicate binding '${stmt.name}' in the same scope`)
        );
      }
      walkExpr(stmt.init, env, errors);
      env.set(stmt.name, true);
    } else if (stmt.kind === 'ExprStmt') {
      walkExpr(stmt.expr, env, errors);
    } else {
      errors.push(new CubescriptError(`Unknown statement kind: ${stmt.kind}`));
    }
  }

  if (errors.length) {
    throw errors[0];
  }
  return { ...ast, analyzed: true };
}
