const ARITH_OPS = new Set(['+', '-', '*', '/']);
const COMPARE_OPS = new Set(['<', '>', '<=', '>=', '===', '!==']);

function foldExpr(expr) {
  switch (expr.kind) {
    case 'Binary': {
      const left = foldExpr(expr.left);
      const right = foldExpr(expr.right);
      if (left.kind === 'Number' && right.kind === 'Number') {
        if (ARITH_OPS.has(expr.op)) {
          const v =
            expr.op === '+'
              ? left.value + right.value
              : expr.op === '-'
                ? left.value - right.value
                : expr.op === '*'
                  ? left.value * right.value
                  : left.value / right.value;
          return { kind: 'Number', value: v };
        }
        if (COMPARE_OPS.has(expr.op)) {
          const v =
            expr.op === '<'
              ? left.value < right.value
              : expr.op === '>'
                ? left.value > right.value
                : expr.op === '<='
                  ? left.value <= right.value
                  : expr.op === '>='
                    ? left.value >= right.value
                    : expr.op === '==='
                      ? left.value === right.value
                      : left.value !== right.value;
          return { kind: 'Boolean', value: v };
        }
      }
      if (left.kind === 'Boolean' && right.kind === 'Boolean') {
        if (expr.op === '&&')
          return { kind: 'Boolean', value: left.value && right.value };
        if (expr.op === '||')
          return { kind: 'Boolean', value: left.value || right.value };
        if (expr.op === '===')
          return { kind: 'Boolean', value: left.value === right.value };
        if (expr.op === '!==')
          return { kind: 'Boolean', value: left.value !== right.value };
      }
      return { ...expr, left, right };
    }
    case 'Unary': {
      const inner = foldExpr(expr.expr);
      if (expr.op === '-' && inner.kind === 'Number') {
        return { kind: 'Number', value: -inner.value };
      }
      if (expr.op === '!' && inner.kind === 'Boolean') {
        return { kind: 'Boolean', value: !inner.value };
      }
      return { ...expr, expr: inner };
    }
    case 'Call':
      return { ...expr, args: expr.args.map(foldExpr) };
    default:
      return expr;
  }
}

function optimizeStmt(stmt) {
  switch (stmt.kind) {
    case 'Let':
      return { ...stmt, init: foldExpr(stmt.init) };
    case 'Assign':
      return { ...stmt, value: foldExpr(stmt.value) };
    case 'ExprStmt':
      return { ...stmt, expr: foldExpr(stmt.expr) };
    case 'FuncDecl':
      return { ...stmt, body: stmt.body.map(optimizeStmt) };
    case 'If':
      return {
        ...stmt,
        cond: foldExpr(stmt.cond),
        then: stmt.then.map(optimizeStmt),
        else: stmt.else ? stmt.else.map(optimizeStmt) : null,
      };
    case 'While':
      return { ...stmt, cond: foldExpr(stmt.cond), body: stmt.body.map(optimizeStmt) };
    case 'Return':
      return { ...stmt, value: stmt.value ? foldExpr(stmt.value) : null };
    case 'Break':
    case 'Continue':
      return stmt;
    default:
      return stmt;
  }
}

export function optimize(ast) {
  return {
    ...ast,
    statements: ast.statements.map(optimizeStmt),
    optimized: true,
  };
}
