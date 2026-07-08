# Agent Guidelines: Building Professional npm Packages

These guidelines help you build high-quality, maintainable npm packages. They are based on best practices and proven workflows.

## 1. Project Setup & Structure

### Initial Setup
- [ ] **Set up TypeScript**
  - `tsconfig.json` with strict mode (`strict: true`)
  - Choose `target` and `module` for your environment (e.g., ES2020, ESNext)
  - Enable declaration files (`declaration: true`)

- [ ] **Choose a build system**
  - **Vite** for modern ESM + CJS dual-output (recommended)
  - Alternative: esbuild or tsup for maximum performance
  - Output: `.js` (ESM), `.cjs` (CommonJS), `.d.ts` (TypeScript Declarations)

- [ ] **Configure package.json**
  - Fill in `name`, `version`, `description`
  - Define `main` (CJS), `module` (ESM), `types` (TypeScript)
  - Add `exports` field for modern module resolution
  - Set `files` array with dist/ and important files
  - Declare `sideEffects` correctly (crucial for tree-shaking)
  - Choose relevant `keywords` (SEO for npm)
  - Specify `license` (MIT, Apache, etc.)
  - Include `repository` and `homepage` for GitHub integration

- [ ] **Essential npm scripts**
  ```json
  {
    "build": "tsc && vite build",
    "dev": "vite",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "test": "vitest run",
    "test:watch": "vitest",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "prepublishOnly": "npm run build && npm run test && npm run lint"
  }
  ```

### Directory Structure
```
project/
├── src/
│   ├── index.ts          # Main entry point
│   ├── types.ts          # Type definitions (public API)
│   ├── constants.ts      # Configuration & constants
│   ├── core/             # Core functionality
│   ├── utils/            # Utilities & helpers
│   └── handlers/         # Event/interaction handlers
├── dist/                 # Build output (gitignored)
├── test/
│   ├── unit/             # Unit tests
│   ├── e2e/              # E2E tests
│   └── setup.ts          # Test configuration
├── demo/                 # Demo/example application
├── .github/workflows/    # CI/CD pipelines
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── eslint.config.js
├── .prettierrc.json
├── CHANGELOG.md
├── RELEASE_NOTES.md      # (for major releases)
└── README.md
```

---

## 2. Code Quality

### Linting & Formatting
- [ ] **Configure ESLint**
  - Use modern ESLint configs (e.g., `@eslint/js`, `typescript-eslint`)
  - Rules: no `any`, strict null checks, unused variables detection
  - Pre-commit hook: `npm run lint:fix` before every commit

- [ ] **Configure Prettier**
  - Enforce consistent code formatting across the project
  - Before every commit: `npm run format` or use pre-commit hook

- [ ] **TypeScript Strict Mode**
  - `strict: true` in tsconfig.json
  - No `any` types (or with explicit comment)
  - All function return types explicitly declared

### Type Definitions
- [ ] **Define public API clearly**
  - All public interfaces/types in `types.ts` or separate `.d.ts`
  - Mark internal types/interfaces as `internal` in docs
  - JSDoc comments for all exports:
    ```typescript
    /**
     * Description of the function
     * @param param1 Parameter description
     * @returns Description of return value
     */
    export function myFunction(param1: string): boolean {
      // ...
    }
    ```

- [ ] **Use generics and conditional types sparingly**
  - Minimize complexity for users
  - Provide sensible defaults

---

## 3. Testing

### Unit Tests
- [ ] **Configure Vitest**
  - Choose jsdom or node environment based on use-case
  - Test code coverage: `vitest run --coverage`
  - Target: at least 80% coverage

- [ ] **Test structure**
  - One test file per source file
  - Use `describe()` for feature groups
  - Use `it()` for individual test cases
  - Write descriptive test names

- [ ] **Example test**
  ```typescript
  describe('TableMinimap', () => {
    it('should initialize with default options', () => {
      const minimap = new TableMinimap('#table');
      expect(minimap.getOptions().mode).toBe('columns');
    });

    it('should handle column selection correctly', () => {
      minimap.setSelectedColumns([0, 2]);
      expect(minimap.getSelectedColumns()).toEqual([0, 2]);
    });
  });
  ```

### E2E Tests
- [ ] **Set up Playwright or Cypress**
  - Test real browser interactions
  - Touch/click events, drag operations, zoom gestures
  - Test at least 3-5 critical user flows

- [ ] **E2E test examples**
  - Initialize component → minimap is visible
  - Click navigation → scroll position changes
  - Touch gestures (pinch, long-press) → correct reaction
  - Test mobile breakpoints

### Continuous Integration
- [ ] **GitHub Actions workflow**
  - Lint + build + test on every push
  - Workflow: `npm run lint && npm run build && npm run test && npm run test:e2e`
  - Run on `main` or PR branches
  - Deploy only on tag pushes (e.g., `v1.0.0`)

---

## 4. Documentation

### README.md
- [ ] **Essential sections**
  1. Badges (version, license, bundle size)
  2. Brief description (1-2 sentences, what it does)
  3. Key features (3-5 bullet points)
  4. Installation (npm, yarn, pnpm)
  5. Quick start (simple code example)
  6. Usage (detailed examples)
  7. API reference (all public methods & properties)
  8. Configuration options (all config parameters)
  9. Examples (1-3 real-world scenarios)
  10. Browser support
  11. Contributing
  12. License

### CHANGELOG.md
- [ ] **Format: Keep a Changelog**
  - Use `## [X.Y.Z] - YYYY-MM-DD` format
  - Categories: `Added`, `Changed`, `Fixed`, `Removed`, `Deprecated`
  - Include compare links at the end (GitHub URLs)
  - Update for each release (before publish)

- [ ] **CHANGELOG example**
  ```markdown
  ## [2.0.0] - 2026-07-01
  
  ### Added
  - Canvas column selection with Finder-like multi-select
  - Enhanced zoom system with readable text scaling
  
  ### Changed
  - BREAKING: Column data extraction requires explicit type handling
  
  ### Fixed
  - Fixed canvas zoom rendering at high magnification
  ```

### RELEASE_NOTES.md (for major releases)
- [ ] **Structure for major releases**
  - Version + date
  - Feature highlights (use emojis for visual interest)
  - Breaking changes (if any)
  - Migration guide (how to update?)
  - API changes (new methods, deprecated properties)
  - Performance improvements
  - Browser compatibility
  - Resources & support

### JSDoc & Inline Comments
- [ ] **Document public API**
  - Every exported function/class has JSDoc
  - Briefly explain complex algorithms
  - Write why-comments, not what-comments

---

## 5. Performance & Bundle Size

### Bundle Optimization
- [ ] **Enable tree-shaking**
  - ESM output as standard
  - `sideEffects: false` in package.json (or CSS only)
  - Import statements: `import { specific } from 'lib'` not `import * as lib`

- [ ] **Check bundle size**
  - Vite shows gzip size automatically
  - Tools: `npm install -g bundlesize` or Bundlephobia
  - Target: as small as possible (typical UI libs < 50kB gzip)

- [ ] **Code splitting**
  - Separate large features into modules (optional imports)
  - Canvas renderer, touch handlers importable separately

### Performance Testing
- [ ] **Write benchmarks**
  - Critical functions: rendering, calculations
  - Tools: Vitest benchmark or dedicated benchmarks
  - Compare with each release

---

## 6. Release Process

### Pre-Release Checklist
- [ ] **Tests pass**
  ```bash
  npm run test
  npm run test:e2e
  npm run lint
  ```

- [ ] **Production build succeeds**
  ```bash
  npm run build
  ```
  - No warnings
  - All `.d.ts` files generated
  - Output contains all expected files

- [ ] **CHANGELOG updated**
  - New section `## [X.Y.Z] - YYYY-MM-DD` with all changes
  - All features, fixes, breaking changes documented

- [ ] **Version bumped in package.json**
  - Semantic Versioning: MAJOR.MINOR.PATCH
  - MAJOR: breaking changes
  - MINOR: new features (backward-compatible)
  - PATCH: bug fixes

- [ ] **Git commit + tag**
  ```bash
  git add CHANGELOG.md package.json README.md
  git commit -m "v2.0.0: Feature description"
  git tag -a v2.0.0 -m "Release v2.0.0 - Description"
  git push origin main
  git push origin --tags
  ```

### Publishing to npm
- [ ] **Authenticate**
  ```bash
  npm login
  npm whoami  # verify
  ```

- [ ] **Dry-run before real publish**
  ```bash
  npm publish --dry-run --access public
  ```
  - Check: correct files, version number, README

- [ ] **Publish**
  ```bash
  npm publish --access public
  ```
  - `prepublishOnly` runs automatically (build + tests)

- [ ] **Verify on npm**
  - Check: https://npmjs.com/package/your-package
  - Correct version?
  - Correct files (dist/, types, README)?
  - README renders correctly?

### Post-Release
- [ ] **Create GitHub Release**
  - Tag → Release on GitHub
  - Copy RELEASE_NOTES.md as body
  - Link demo & documentation

- [ ] **Deploy demo** (if applicable)
  ```bash
  npm run deploy  # gh-pages
  ```

- [ ] **Post on social media**
  - X/Twitter, LinkedIn, etc.
  - Witty but stylish
  - Include demo link, key features

---

## 7. Maintenance & Updates

### Version Management
- [ ] **Follow semantic versioning strictly**
  - Breaking changes = MAJOR version
  - New features = MINOR version
  - Bug fixes = PATCH version
  - No skipping (e.g., 1.0.0 → 1.2.0 is okay for MINOR)

- [ ] **Mark deprecated APIs**
  - Use `@deprecated` JSDoc tag
  - Warn for several releases before removal
  - Suggest alternative in comment

### Dependencies
- [ ] **Aim for zero dependencies**
  - Only production dependencies if absolutely necessary
  - devDependencies don't affect bundle size

- [ ] **Check security**
  - Run `npm audit` regularly
  - Check CVEs on npm.com or security.npmjs.org
  - Keep dependencies up-to-date

### Community & Support
- [ ] **Handle issues**
  - Have GitHub issues template
  - Quick response (≤ 24h if possible)
  - Label system: bug, feature, documentation, etc.

- [ ] **Contribution guidelines**
  - Write `CONTRIBUTING.md`
  - Document dev setup
  - PR template with checklist

---

## 8. Special Considerations

### Framework Agnostic Packages
- [ ] **No framework dependencies**
  - Pure JavaScript/TypeScript only (Vanilla JS)
  - No React, Vue, Angular runtime dependency
  - Use HTML/DOM APIs only where necessary

- [ ] **Multiple environment support**
  - Browser (DOM APIs)
  - Node.js (if relevant)
  - Test in different environments

### UI/DOM Packages
- [ ] **CSS modularization**
  - CSS Modules or BEM naming convention
  - Shadow DOM for encapsulation (optional)
  - CSS variables for theming
  - Light + dark mode support

- [ ] **Accessibility (a11y)**
  - ARIA attributes where relevant
  - Keyboard navigation
  - Color contrast (WCAG AA min.)
  - Screen reader testing

### Touch & Mobile Support
- [ ] **Touch event handling**
  - Separate touch event handlers
  - Gesture recognition (double-tap, long-press, pinch)
  - Touch target size ≥ 44x44px (mobile)

- [ ] **Mobile testing**
  - Real device testing (or DevTools mobile emulation)
  - Test viewport sizes: 375x667 (iPhone), 414x896 (iPhone Max), etc.
  - Test touch gestures in E2E tests

---

## 9. Quick Checklists

### Before every commit
```
- [ ] `npm run lint` (0 errors)
- [ ] `npm run format` (code formatted)
- [ ] `npm run test` (tests passing)
- [ ] Git commit with descriptive message
```

### Before every release
```
- [ ] All tests passing (`npm run test:e2e` too)
- [ ] `npm run build` successful (no warnings)
- [ ] CHANGELOG.md updated
- [ ] package.json version bumped (semantic versioning)
- [ ] README.md current?
- [ ] TypeScript declarations generated?
- [ ] Demo working?
- [ ] Social media text prepared?
```

### Publishing workflow
```
1. git add + git commit
2. git tag -a vX.Y.Z
3. git push origin main && git push origin --tags
4. npm publish --access public
5. Create GitHub Release
6. Post on social media
7. Verify npm registry
```

---

## 10. Tools & Recommendations

### Development
- **Editor**: VS Code + TypeScript Extension
- **Version Manager**: nvm (Node Version Manager)
- **Package Manager**: npm or pnpm

### Build & Bundling
- **Bundler**: Vite (modern, fast, ESM-first)
- **Transpiler**: TypeScript (`tsc`)
- **Declaration Files**: `vite-plugin-dts`

### Testing
- **Unit Tests**: Vitest (Vite-native)
- **E2E Tests**: Playwright or Cypress
- **Coverage**: Vitest coverage

### Code Quality
- **Linting**: ESLint + typescript-eslint
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode
- **Pre-commit Hooks**: Husky + lint-staged (optional)

### CI/CD
- **GitHub Actions**: Built-in, free for public repos
- **Workflow**: lint → build → test → e2e → publish (on tag)

### Publishing & Distribution
- **npm Registry**: https://npmjs.com
- **Bundlephobia**: Check bundle size
- **GitHub Pages**: Demo hosting

### Documentation
- **README**: Markdown (GitHub native)
- **CHANGELOG**: Keep a Changelog format
- **JSDoc**: Inline TypeScript comments
- **API Docs**: TypeDoc or similar (optional)

---

## 11. Red Flags / Avoid

❌ **Don't do these**
- Publish untested code
- Forget to update CHANGELOG
- Use `npm version` without understanding SemVer
- Publish breaking changes in PATCH versions
- Leave unused dependencies
- Ignore TypeScript warnings
- Skip E2E tests for UI packages
- Publish without `prepublishOnly` script
- Forget to update README with new API
- Release without git tag
- Mix multiple unrelated features in one release

---

## Example: table-minimap v2.0.0 Workflow

```bash
# 1. Development + testing
npm run dev
npm run lint:fix
npm run format
npm run test
npm run test:e2e

# 2. Check build
npm run build

# 3. Version + CHANGELOG
# → Edit package.json: version 1.3.0 → 2.0.0
# → Update CHANGELOG.md with v2.0.0 section
# → Create RELEASE_NOTES.md (major release)

# 4. Git commit
git add CHANGELOG.md RELEASE_NOTES.md package.json src/
git commit -m "v2.0.0: Canvas selection, zoom, mobile gestures"

# 5. Git tag
git tag -a v2.0.0 -m "Release v2.0.0 - Major feature additions"

# 6. Push
git push origin main
git push origin --tags

# 7. Publish to npm (requires auth)
npm login
npm publish --access public

# 8. Deploy demo (optional)
npm run deploy

# 9. Create GitHub Release
# (with RELEASE_NOTES.md as body)

# 10. Social media post
# (witty but stylish)
```

---

## 📝 Notes

- This document is based on best practices and the table-minimap project
- Adapt guidelines to your project (not all points apply to every package)
- Continuous improvement: update these guidelines with new learnings
- Incorporate community feedback

---

**Happy Building! 🚀**

