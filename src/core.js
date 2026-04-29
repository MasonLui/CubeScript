export class CubescriptError extends Error {
  constructor(message, { line, col } = {}) {
    super(message);
    this.name = 'CubescriptError';
    this.line = line;
    this.col = col;
  }
}

export function formatError(err) {
  if (err instanceof CubescriptError && err.line != null) {
    return `${err.name} at ${err.line}:${err.col}: ${err.message}`;
  }
  return `${err.name}: ${err.message}`;
}
