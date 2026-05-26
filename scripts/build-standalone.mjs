import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const outputName = process.argv[2] || "typhoon-standalone.html";
const outputPath = path.resolve(repoRoot, outputName);

const indexPath = path.join(repoRoot, "index.html");
const stylesPath = path.join(repoRoot, "styles.css");
const appScriptPath = path.join(repoRoot, "script.js");

const [indexHtml, styles, appScript] = await Promise.all([
  readFile(indexPath, "utf8"),
  readFile(stylesPath, "utf8"),
  readFile(appScriptPath, "utf8"),
]);

let standalone = indexHtml
  .replace(
    /<link rel="stylesheet" href="styles\.css" \/>/,
    `<style>\n${styles}\n    </style>`,
  )
  .replace(
    /<script src="script\.js"><\/script>/,
    `<script>\n${appScript}\n    </script>`,
  );

if (standalone === indexHtml) {
  throw new Error("Standalone build did not inline styles or script; check index.html asset tags.");
}

await writeFile(outputPath, standalone, "utf8");
console.log(`Generated ${path.relative(repoRoot, outputPath)}`);
