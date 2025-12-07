# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-12-06

### Added

- Initial release of SpecDeck CLI
- `list` command for releases, features, and stories
  - Filter stories by status, complexity, feature, and owner
  - Statistics view for story breakdown
  - JSON output support
- `create` command for releases and features
  - Generate release files with YAML front matter
  - Interactive guidance for feature creation
- `propose` command for feature decomposition
  - Decomposition guidance with story patterns
  - Proposal template generation
- `sync` command for OpenSpec integration
  - Status reconciliation with change proposals
  - Dry-run mode for preview
- `validate` command for structure validation
  - Validate vision, releases, and project plan
  - Strict validation mode
- Markdown parser with YAML front matter support
- Zod schema validation for stories, releases, features
- Repository pattern for file I/O abstraction
- Service layer for business logic
- Comprehensive test suite
- Full documentation (README, CONTRIBUTING)

### Dependencies

- commander@11.1.0 - CLI framework
- zod@3.22.4 - Schema validation
- unified@11.0.4 - Markdown parsing
- remark-parse@11.0.0 - Markdown AST
- remark-gfm@4.0.0 - GitHub Flavored Markdown
- remark-frontmatter@5.0.0 - YAML front matter
- yaml@2.3.4 - YAML parsing
- chalk@5.3.0 - Terminal colors

[Unreleased]: https://github.com/yourusername/specdeck/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/specdeck/releases/tag/v0.1.0
