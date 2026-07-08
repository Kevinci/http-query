# Publishing Guide for @http-query/client

This guide explains how to publish `@http-query/client` to npm.

## Prerequisites

1. **npm account** — register at https://www.npmjs.com if you don't have one
2. **GitHub repository** — with write access
3. **Access token** — npm and GitHub tokens for automation

## Step 1: Prepare Local Environment

```bash
cd /Users/kevinimig/IdeaProjects/http-query

# Verify git is initialized and remote is set
git remote -v
# If no remote, add it:
# git remote add origin https://github.com/YOUR_USERNAME/http-query.git

# Verify tests pass
cd packages/client
npm test -- --run
npm run build

# Go back to root
cd ../..
```

## Step 2: Create npm Organization (Optional but Recommended)

To reserve the `@http-query` scope:

1. Go to https://www.npmjs.com/org/create
2. Create org named `http-query`
3. Add your user as member
4. Note down the org URL: `https://www.npmjs.com/org/http-query`

## Step 3: Update GitHub Repository Info

If your GitHub repo URL is different, update `packages/client/package.json`:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/YOUR_USERNAME/http-query.git",
  "directory": "packages/client"
},
"homepage": "https://github.com/YOUR_USERNAME/http-query/tree/main/packages/client#readme"
```

## Step 4: Configure GitHub Secrets for Automation

To use the release workflow (`.github/workflows/release.yml`):

1. Go to repo Settings → Secrets and variables → Actions
2. Add secret `NPM_TOKEN`:
   - Generate token at https://www.npmjs.com/settings/tokens
   - Choose "Automation" token type (can publish)
   - Copy and paste into GitHub Secret

## Step 5: Manual First Release (Recommended)

Before automating, do a manual release to ensure everything works:

```bash
cd /Users/kevinimig/IdeaProjects/http-query/packages/client

# Login to npm
npm login

# Publish (this will publish version 0.1.0 from package.json)
npm publish --access public

# Verify it worked
npm view @http-query/client
```

Expected output:
```
@http-query/client@0.1.0

  TypeScript client for the HTTP QUERY method (RFC 10008)...
  dist: 7.5KB
  ...
```

## Step 6: Create GitHub Release (Optional)

After successful npm publish:

```bash
# Tag the release
git tag -a v0.1.0 -m "Release @http-query/client v0.1.0"
git push origin v0.1.0

# Go to https://github.com/YOUR_USERNAME/http-query/releases
# Click "Create release from tag"
# Use CHANGELOG or describe the release
```

## Step 7: Set Up Automated Releases (Future)

To automate future releases:

1. Push changesets to a branch
2. GH Actions will create a "Release PR"
3. Merge the PR → GH Actions publishes automatically

### Manual Automated Release

If you want to trigger a release manually:

```bash
# Push changes with changesets
git add .changeset/
git commit -m "Prepare release"
git push origin main

# Go to https://github.com/YOUR_USERNAME/http-query/actions
# Click on "Release to npm" workflow
# Click "Run workflow" button
# Select version bump (patch, minor, major)
```

## Step 8: Announce

- Tweet about it on your social media (if desired)
- Share on dev communities (Dev.to, Reddit r/typescript, Hacker News, etc.)
- Add to awesome-http or awesome-typescript lists

**Announcement template:**

```
🚀 Releasing @http-query/client v0.1.0 — 
Reference implementation of HTTP QUERY method (RFC 10008).

Features:
• Type-safe TypeScript client
• Automatic QUERY → POST → GET fallbacks
• Retries, timeout, middleware, caching
• Zero runtime dependencies

Try it: npm install @http-query/client

GitHub: https://github.com/YOUR_USERNAME/http-query
Demo: https://github.com/YOUR_USERNAME/http-query/tree/main/packages/client/demo

#http #typescript #openstandards
```

---

## Troubleshooting

### "npm ERR! 403 Forbidden"

- Ensure you're logged in: `npm whoami`
- Check org permissions (if using org)
- Verify token has "publish" permission

### "npm ERR! 404 Not Found"

- Ensure package name is correct in `package.json`
- Ensure `npm view @http-query/client` is still 404 before first publish

### "npm ERR! You do not have permission to publish..."

- This usually means the scope `@http-query` is not created or you don't have access
- Create the org or ask org admin for write access

### Tests fail before publish

```bash
cd packages/client
npm test -- --run

# If tests fail, fix them before publishing
```

### Build fails

```bash
cd packages/client
npm run build

# Check errors and fix src/ files
```

---

## Future Releases

After v0.1.0, follow semantic versioning:

1. Create changesets for each feature/fix:
   ```bash
   npm run changeset add
   # or manually: create .changeset/XXXX-description.md
   ```

2. Commit and push

3. Merge PR to main (GH Actions creates release PR)

4. Merge release PR (GH Actions publishes to npm)

---

## Additional Resources

- npm Publishing Docs: https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry
- Changesets Docs: https://github.com/changesets/changesets
- RFC 10008 (HTTP QUERY): https://github.com/httpwg/http-extensions/blob/main/draft-ietf-httpbis-query.md (or IANA registry)

---

Generated: July 8, 2026  
Last Updated: Prepare for v0.1.0 release

