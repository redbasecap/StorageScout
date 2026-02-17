# Contributing to StorageScout

Thank you for your interest in contributing to StorageScout! 🎉

## Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Set up** the development environment (see below)
4. **Create** a feature branch (`git checkout -b feat/my-feature`)
5. **Commit** your changes with clear messages
6. **Push** to your fork and open a **Pull Request**

## Development Setup

### Docker (Recommended)

```bash
make dev-docker
```

### Manual

```bash
npm install
npm run dev
```

## Code Style

- **TypeScript** — strict mode, no `any` unless justified
- **React** — functional components with hooks
- **Formatting** — follow the existing ESLint / Prettier config
- **Commits** — use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`)

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include a clear description of what changed and why
- Ensure `npm run typecheck` and `npm run lint` pass
- Add/update documentation if you change behaviour
- Screenshots for UI changes are appreciated

## Reporting Issues

- Use [GitHub Issues](https://github.com/redbasecap/StorageScout/issues)
- Include steps to reproduce, expected vs actual behaviour
- Mention your environment (browser, OS, Docker/native)

## Architecture

See [CLAUDE.md](CLAUDE.md) for architecture decisions and development guidelines.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
