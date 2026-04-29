#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { compile, stages } from './compiler.js';
import { CubescriptError, formatError } from './core.js';

const [, , command, filePath] = process.argv;

function usage() {
  console.error(`Usage: cubescript <command> <file>

Commands:
  syntax     Check syntax only (parse)
  parse      Print JSON AST after parsing
  analyze    Run static analysis (prints "ok" on success)
  optimize   Print JSON AST after parse, analyze, optimize
  generate   Print generated JavaScript
  run        Full pipeline: generate and eval (dev only; not for untrusted input)
`);
  process.exit(1);
}

function readInput(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch (e) {
    if (e && e.code === 'ENOENT') {
      throw new CubescriptError(`File not found: ${path}`);
    }
    throw e;
  }
}

function main() {
  if (!command || !filePath) {
    usage();
  }

  try {
    const source = readInput(filePath);
    switch (command) {
      case 'syntax': {
        stages.parse(source);
        console.log('syntax ok');
        break;
      }
      case 'parse': {
        const ast = stages.parse(source);
        console.log(JSON.stringify(ast, null, 2));
        break;
      }
      case 'analyze': {
        stages.analyze(source);
        console.log('analysis ok');
        break;
      }
      case 'optimize': {
        const ast = stages.optimize(source);
        console.log(JSON.stringify(ast, null, 2));
        break;
      }
      case 'generate': {
        const { code } = compile(source);
        console.log(code);
        break;
      }
      case 'run': {
        const { code } = compile(source);
        const result = eval(code);
        if (result !== undefined) {
          console.log(result);
        }
        break;
      }
      default:
        usage();
    }
  } catch (e) {
    console.error(formatError(e));
    process.exit(1);
  }
}

main();
