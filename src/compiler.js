import { analyze } from './analyzer.js';
import { optimize } from './optimizer.js';
import { generate } from './generator.js';
import { parse } from './parser.js';

export function compile(source, { optimize: doOpt = true } = {}) {
  let ast = parse(source);
  ast = analyze(ast);
  if (doOpt) {
    ast = optimize(ast);
  }
  const code = generate(ast);
  return { ast, code };
}

export const stages = {
  parse: (source) => parse(source),
  analyze: (source) => analyze(parse(source)),
  optimize: (source) => optimize(analyze(parse(source))),
  generate: (source) => generate(optimize(analyze(parse(source)))),
};
