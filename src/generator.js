function genExpr(expr) {
  switch (expr.kind) {
    case 'Number':
      return String(expr.value);
    case 'Boolean':
      return String(expr.value);
    case 'String':
      return JSON.stringify(expr.value);
    case 'Id':
      return expr.name;
    case 'Binary':
      return `(${genExpr(expr.left)} ${expr.op} ${genExpr(expr.right)})`;
    case 'Unary':
      return `(${expr.op}${genExpr(expr.expr)})`;
    case 'Call':
      return `${expr.name}(${expr.args.map(genExpr).join(', ')})`;
    default:
      throw new Error(`Cannot generate code for ${expr.kind}`);
  }
}

function genStmts(stmts, indent) {
  return stmts.map((s) => genStmt(s, indent)).join('\n');
}

function genStmt(stmt, indent = '') {
  const i = indent;
  const i2 = indent + '  ';
  switch (stmt.kind) {
    case 'Let':
      return `${i}let ${stmt.name} = ${genExpr(stmt.init)};`;
    case 'Assign':
      return `${i}${stmt.name} = ${genExpr(stmt.value)};`;
    case 'ExprStmt':
      return `${i}${genExpr(stmt.expr)};`;
    case 'FuncDecl': {
      const params = stmt.params.join(', ');
      const body = genStmts(stmt.body, i2);
      return `${i}function ${stmt.name}(${params}) {\n${body}\n${i}}`;
    }
    case 'If': {
      const cond = genExpr(stmt.cond);
      const then = genStmts(stmt.then, i2);
      let out = `${i}if (${cond}) {\n${then}\n${i}}`;
      if (stmt.else) {
        const el = genStmts(stmt.else, i2);
        out += ` else {\n${el}\n${i}}`;
      }
      return out;
    }
    case 'While': {
      const cond = genExpr(stmt.cond);
      const body = genStmts(stmt.body, i2);
      return `${i}while (${cond}) {\n${body}\n${i}}`;
    }
    case 'Return':
      return stmt.value ? `${i}return ${genExpr(stmt.value)};` : `${i}return;`;
    case 'Break':
      return `${i}break;`;
    default:
      throw new Error(`Cannot generate code for statement kind: ${stmt.kind}`);
  }
}

export function generate(ast) {
  return ast.statements.map((s) => genStmt(s, '')).join('\n');
}
