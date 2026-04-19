/**
 * Re-embeds brain/brain-index.json and BRAIN_CONTENT from brain/*.md + products.json
 * into brain.html. Run from repo root: node scripts/sync-brain-html.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const htmlPath = path.join(root, "brain.html");
const indexPath = path.join(root, "brain", "brain-index.json");
const brainDir = path.join(root, "brain");

const html = fs.readFileSync(htmlPath, "utf8");
const brainIndex = JSON.parse(fs.readFileSync(indexPath, "utf8"));

const marker = "\n\n    /* ── State ────────────────────────────────────────────────────────── */";
const iContent = html.indexOf("const BRAIN_CONTENT = ");
if (iContent === -1) throw new Error("BRAIN_CONTENT not found");
const afterContent = html.indexOf(marker, iContent);
if (afterContent === -1) throw new Error("State marker not found after BRAIN_CONTENT");

const iIndex = html.indexOf("const BRAIN_INDEX   = ");
if (iIndex === -1) throw new Error("BRAIN_INDEX not found");
const iIndexEnd = html.indexOf(";\n    const BRAIN_CONTENT", iIndex);
if (iIndexEnd === -1) throw new Error("BRAIN_INDEX end delimiter not found");

const brainContent = {};
for (const f of brainIndex.files) {
  if (f.path.endsWith(".md")) {
    const fp = path.join(brainDir, f.path);
    if (!fs.existsSync(fp)) throw new Error(`Missing brain file: ${fp}`);
    brainContent[f.id] = fs.readFileSync(fp, "utf8");
  } else if (f.path === "products.json") {
    brainContent[f.id] = fs.readFileSync(path.join(brainDir, "products.json"), "utf8");
  }
}

const newIndexLine = `    const BRAIN_INDEX   = ${JSON.stringify(brainIndex)};`;
const newContentLine = `    const BRAIN_CONTENT = ${JSON.stringify(brainContent)};`;

const out =
  html.slice(0, iIndex) +
  newIndexLine +
  "\n" +
  newContentLine +
  html.slice(afterContent);

fs.writeFileSync(htmlPath, out);
console.log("Updated brain.html from brain-index.json + brain/*.md + products.json");
