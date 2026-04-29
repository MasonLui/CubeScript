function foldExpr(expr) {
  switch (expr.kind) {
    case 'Binary': {
      const left = foldExpr(expr.left);
      const right = foldExpr(expr.right);
      if (left.kind === 'Number' && right.kind === 'Number') {
        if (expr.op === '+') {
          return { kind: 'Number', value: left.value + right.value };
        }
        if (expr.op === '*') {
          return { kind: 'Number', value: left.value * right.value };
        }
      }
      return { ...expr, left, right };
    }
    default:
      return expr;
  }
}

function optimizeStmt(stmt) {
  if (stmt.kind === 'Let') {
    return { ...stmt, init: foldExpr(stmt.init) };
  }
  if (stmt.kind === 'ExprStmt') {
    return { ...stmt, expr: foldExpr(stmt.expr) };
  }
  return stmt;
}

export function optimize(ast) {
  return {
    ...ast,
    statements: ast.statements.map(optimizeStmt),
    optimized: true,
  };
}
