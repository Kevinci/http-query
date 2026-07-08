const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const pkgDir = path.resolve(__dirname, "..");
const docsTarget = path.join(root, "docs", "client");

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function copy(src, dest) {
  if (!fs.existsSync(src)) return;
  execSync(`cp -R "${src}" "${dest}"`);
}

try {
  // ensure build exists
  const buildCmd = "npx tsup";
  console.log("Building package...");
  execSync(buildCmd, { cwd: pkgDir, stdio: "inherit" });

  console.log("Preparing docs/client for GitHub Pages...");
  cleanDir(docsTarget);
  fs.mkdirSync(docsTarget, { recursive: true });

  // copy built files and demo
  copy(path.join(pkgDir, "dist"), docsTarget);
  copy(path.join(pkgDir, "demo"), docsTarget);

  console.log("Prepared docs/client. You can now push to GitHub and enable Pages from the docs/ directory.");
} catch (err) {
  console.error(err);
  process.exit(1);
}

