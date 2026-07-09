const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const scriptsDir = __dirname; // packages/client/scripts
const clientDir = path.resolve(scriptsDir, ".."); // packages/client
const packagesDir = path.resolve(clientDir, ".."); // packages
const repoRoot = path.resolve(packagesDir, ".."); // repo root
const docsTarget = path.join(packagesDir, "docs"); // packages/docs (uploaded by the Pages workflow)

const PACKAGES = ["core", "client", "react", "next"];

function cleanDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

try {
  // 1) Build every package so the dist bundles are available for direct reference.
  console.log("Building all packages...");
  execSync("npm run build", { cwd: repoRoot, stdio: "inherit" });

  // 2) Reset the docs output.
  console.log("Preparing packages/docs for GitHub Pages...");
  cleanDir(docsTarget);
  fs.mkdirSync(docsTarget, { recursive: true });

  // 3) The documentation landing page lives at the site root.
  fs.copyFileSync(path.join(clientDir, "demo", "index.html"), path.join(docsTarget, "index.html"));

  // 4) Copy each package's built bundle under /<pkg>/ for optional CDN-style use.
  for (const pkg of PACKAGES) {
    const dist = path.join(packagesDir, pkg, "dist");
    if (fs.existsSync(dist)) {
      const dest = path.join(docsTarget, pkg);
      fs.mkdirSync(dest, { recursive: true });
      fs.cpSync(dist, dest, { recursive: true });
    }
  }

  console.log("Prepared packages/docs. Site root: index.html; bundles under /<package>/.");
} catch (err) {
  console.error(err);
  process.exit(1);
}
