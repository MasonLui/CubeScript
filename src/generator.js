function genExpr(expr, names) {
  switch (expr.kind) {
    case 'Number':
      return String(expr.value);
    case 'String':
      return JSON.stringify(expr.value);
    case 'Id':
      return expr.name;
    case 'Binary': {
      const l = genExpr(expr.left, names);
      const r = genExpr(expr.right, names);
      return `(${l} ${expr.op} ${r})`;
    }
    default:
      throw new Error(`Cannot generate code for ${expr.kind}`);
  }
}

export function generate(ast) {
  const lines = [];
  const declared = new Set();

  for (const stmt of ast.statements) {
    if (stmt.kind === 'Let') {
      const rhs = genExpr(stmt.init, declared);
      lines.push(`let ${stmt.name} = ${rhs};`);
      declared.add(stmt.name);
    } else if (stmt.kind === 'ExprStmt') {
      lines.push(`${genExpr(stmt.expr, declared)};`);
    }
  }

  return lines.join('\n');
}
