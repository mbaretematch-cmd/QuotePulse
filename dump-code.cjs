const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = 'codebase_dump.txt';

// Directories to skip
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.vscode',
  '.idea',
  'coverage',
  '.next'
]);

// Specific files to skip
const IGNORED_FILES = new Set([
  OUTPUT_FILE,
  'dump-code.js',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.DS_Store'
]);

// Binary / non-text extensions to skip
const IGNORED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
  '.woff', '.woff2', '.ttf', '.eot',
  '.mp4', '.mp3', '.pdf', '.zip', '.tar', '.gz'
]);

function shouldIgnore(fileName) {
  if (IGNORED_FILES.has(fileName)) return true;
  const ext = path.extname(fileName).toLowerCase();
  if (IGNORED_EXTENSIONS.has(ext)) return true;
  return false;
}

function getFilesRecursively(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!IGNORED_DIRS.has(file)) {
        getFilesRecursively(filePath, fileList);
      }
    } else {
      if (!shouldIgnore(file)) {
        fileList.push(filePath);
      }
    }
  }

  return fileList;
}

function generateDump() {
  const rootDir = process.cwd();
  console.log(`Scanning directory: ${rootDir}...`);

  const allFiles = getFilesRecursively(rootDir);
  let outputContent = `=== PROJECT FILE TREE ===\n\n`;

  allFiles.forEach((file) => {
    const relativePath = path.relative(rootDir, file);
    outputContent += `${relativePath}\n`;
  });

  outputContent += `\n================================================================================\n`;
  outputContent += `=== FULL FILE CONTENTS ===\n`;
  outputContent += `================================================================================\n\n`;

  allFiles.forEach((file) => {
    const relativePath = path.relative(rootDir, file);
    try {
      const content = fs.readFileSync(file, 'utf8');
      outputContent += `================================================================================\n`;
      outputContent += `FILE: ${relativePath}\n`;
      outputContent += `================================================================================\n`;
      outputContent += `${content}\n\n`;
    } catch (err) {
      outputContent += `[Error reading file: ${relativePath}]\n\n`;
    }
  });

  fs.writeFileSync(OUTPUT_FILE, outputContent, 'utf8');
  console.log(`\nSuccess! Entire codebase bundled into '${OUTPUT_FILE}'.`);
  console.log(`You can now upload '${OUTPUT_FILE}' directly here.`);
}

generateDump();