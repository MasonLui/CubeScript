# Cubescript

<div align="center">

<img src="docs/logo.svg" width="120" height="120" alt="Cubescript logo — grass block cube" />

**Write logic for cube worlds — statically checked, Sponge-ready.**

</div>

## Team

| Name | GitHub |
|------|--------|
| Mason Lui | [@MasonLui](https://github.com/MasonLui) |
| Leila Nawas | [@leilanawas](https://github.com/leilanawas) |
| Aidan Hodges | [@aidanhodges27](https://github.com/aidanhodges27) |
| Paige Inoue | [@paigei](https://github.com/paigei) |
| Cooper Clausen | [@CooperClausen](https://github.com/CooperClausen) |

## One-paragraph story

**Cubescript** is a statically checked scripting language designed for the **Sponge** modding ecosystem. You write `.cube` files that describe game logic — event handlers, world queries, item recipes — and the compiler catches scope errors, type mismatches, and bad control flow at compile time instead of deep inside a running Minecraft server. Cubescript compiles to JavaScript intended to run inside a [SpongeForge](https://spongepowered.org/) plugin host via **GraalVM's Polyglot API**, which lets the JVM execute JS without leaving the server process or launching any external runtime. Under the hood this is a real CMSI 3802 pipeline: Ohm grammar, AST, static analysis, optimization, and JS codegen. Anything not shipped yet is marked **Not yet implemented**.

*Cubescript is a student project and is not affiliated with Mojang, Microsoft, Minecraft, or the SpongePowered project.*

## Target runtime architecture

```
.cube source
    │
    ▼  cubescript compile
 JavaScript (ES module)
    │
    ▼  embedded inside
 SpongeForge plugin (Java)
    │  ← loads via GraalVM Polyglot API
    ▼
 Minecraft: Java Edition server
```

A thin companion Sponge plugin loads the compiled `.cube` output using GraalVM's `Context.eval("js", ...)` — no external Node process, no separate runtime. This is the intended deployment target; the current compiler already emits the correct JS. The companion plugin host is **not yet implemented** and is future work.

## Features (starter checklist — edit as you grow)

- File extension **`.cube`** (Cubescript source)
- Ohm-based syntax for top-level `let` and expression statements
- Double-quoted string literals (no `"` or newlines inside the string)
- Arithmetic `+`, `*`, parentheses
- Static scope: duplicate `let` and undefined name errors at compile time
- Constant folding for `+` and `*` on numeric literals
- JavaScript code generation (GraalVM-compatible ES output)

## Static, safety, and security checks

| Check | Status |
|-------|--------|
| Parse / syntax errors | Implemented |
| Undefined identifiers | Implemented |
| Duplicate bindings in the same scope | Implemented |
| Type checking | **Not yet implemented** |
| Control-flow (`return`/`break`/`continue`) | **Not yet implemented** (no such statements yet) |

**Security note:** the CLI `run` command uses `eval` only as a teaching shortcut. The production path is `generate` → embed output in the Sponge GraalVM host.

## Setup (step by step)

1. **Install Node 18+** (LTS is fine).
2. In this directory run **`npm install`** (creates `node_modules/`; keep it out of git).
3. Run **`npm test`** — all tests should pass and `c8` should print coverage.
4. Try the CLI:
   `node src/cubescript.js run examples/06-hello-world.cube`
5. The public repo is at **https://github.com/MasonLui/CubeScript** — keep `repository.url` in `package.json` and the Authors field up to date as teammates are added.
6. Turn on **GitHub Pages** from the `docs/` folder.
7. As the language grows, keep **README** and **examples** accurate; mark unimplemented features explicitly.

## Repository layout

Matches the course spec: `src/cubescript.js`, `src/cubescript.ohm`, `compiler.js`, `parser.js`, `core.js`, `analyzer.js`, `optimizer.js`, `generator.js`, `test/` (coverage via `npm test`), `examples/*.cube`, `docs/` (GitHub Pages).

## Companion website

After you publish GitHub Pages from `docs/`, add the live link here:

**Site:** _https://masonlui.github.io/CubeScript/_

## Usage (CLI)

```bash
npm install
node src/cubescript.js syntax   examples/02-arithmetic.cube
node src/cubescript.js parse    examples/02-arithmetic.cube
node src/cubescript.js analyze  examples/02-arithmetic.cube
node src/cubescript.js optimize examples/02-arithmetic.cube
node src/cubescript.js generate examples/06-hello-world.cube
node src/cubescript.js run       examples/06-hello-world.cube
```

Global install (optional): `npm link` then `cubescript generate file.cube`.

## Examples vs JavaScript

The `generate` command emits GraalVM-compatible JavaScript. A SpongeForge plugin embeds this output via `Context.eval("js", source)`.

| Cubescript | Generated JavaScript |
|------------|----------------------|
| `let cobble_stacks = 1 + 2;` | `let cobble_stacks = 3;` (constant-folded) |
| `let greeting = "Hello, Overworld!";` | `let greeting = "Hello, Overworld!";` |

More side-by-side samples will be added here as the language grows.

## Grammar

Ohm spec: [`src/cubescript.ohm`](src/cubescript.ohm)

## Tests and coverage

```bash
npm test
```

Uses `c8` over Node's built-in test runner. Aim for **100% coverage** on the final submission; this scaffold is a starting point.

## License

MIT — see `LICENSE`.
