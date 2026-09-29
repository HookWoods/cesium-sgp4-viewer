# Contributing

Thanks for taking the time to contribute. Bug reports, fixes, documentation and new features are all welcome.

## Before you start

- For anything larger than a small fix, open an issue first so the approach can be discussed before you spend time on it.
- Be kind: this project follows a [code of conduct](CODE_OF_CONDUCT.md).

## Setup

Requirements: Node.js 22 or later (see `.nvmrc`) and [pnpm](https://pnpm.io) (the version is pinned in `package.json`; `corepack enable` picks it up).

```sh
pnpm install
pnpm examples:dev      # vanilla example on http://localhost:5173
pnpm --filter example-react dev
```

The examples run against the library sources, so changes in `src/` show up immediately.

## Checks

```sh
pnpm lint           # ESLint
pnpm format         # Prettier (pnpm format:check in CI)
pnpm typecheck      # library and examples
pnpm test           # unit tests (Vitest)
pnpm bench          # benchmarks of the hot paths, to compare before and after a change
pnpm build          # ES module, IIFE bundle and type declarations in dist/
pnpm check:package  # publint and arethetypeswrong on the packed tarball
```

CI runs all of them on every pull request.

## Project layout

| Path                    | Contents                                                    |
| ----------------------- | ----------------------------------------------------------- |
| `src/tle`               | TLE parsing and validation                                  |
| `src/orbit`             | Mean elements and regime classification                     |
| `src/sgp4`              | SGP4 propagation to TEME and Earth-fixed frames             |
| `src/sampling`          | Sampling grid and interpolation                             |
| `src/worker`            | Propagation workers and their pool                          |
| `src/render`            | Cesium primitives: points, orbits, selection marker         |
| `src/camera`            | Inertial camera                                             |
| `src/SatelliteLayer.ts` | The public facade                                           |
| `examples/`             | Vanilla and React examples, Sandcastle script, TLE snapshot |

Everything under `src/` except `src/render`, `src/camera` and `SatelliteLayer.ts` is free of Cesium and covered by unit tests. Rendering changes are checked by hand in both examples, in 3D and 2D.

## Commits and pull requests

Pull requests are squash-merged, and their title becomes the commit message on `main`. Titles follow [Conventional Commits](https://www.conventionalcommits.org):

- `feat: …` a new feature (minor version)
- `fix: …` a bug fix (patch version)
- `feat!: …` or a `BREAKING CHANGE:` footer for incompatible changes
- `docs:`, `test:`, `refactor:`, `perf:`, `build:`, `ci:`, `chore:` otherwise

Releases are automated: [release-please](https://github.com/googleapis/release-please) maintains a release pull request with the changelog, and merging it publishes the package to npm.
