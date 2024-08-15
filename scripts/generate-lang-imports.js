// This script generates imports for all language files in the languages directory.
// It also generates a list of language options for the language selector component.
// The list of language files is stored in a file named languageList.json.

// Usage: node scripts/generate-lang-imports.js 'langName.json' 'Language Name'
// For example: node scripts/generate-lang-imports.js 'fr.json' 'French'
// This will generate the mew fr.json file in languages directory with the key: string to be translated.

const fs = require('fs');
const path = require('path');

const languagesDir = path.resolve(__dirname, '../src/languages');
const outputFilePath = path.resolve(__dirname, '../src/localize/languageImports.ts');
const languageListPath = path.resolve(__dirname, '../src/localize/languageList.json');

const currentFiles = fs.readdirSync(languagesDir).filter((file) => file.endsWith('.json'));
let previousFiles = [];

if (fs.existsSync(languageListPath)) {
  previousFiles = JSON.parse(fs.readFileSync(languageListPath, 'utf8'));
}

const filesToRemove = previousFiles.filter((file) => !currentFiles.includes(file));
const filesToAdd = currentFiles.filter((file) => !previousFiles.includes(file));

// Update the languageList.json with the current list of files
fs.writeFileSync(languageListPath, JSON.stringify(currentFiles, null, 2));

// Generate imports for the current files
const imports = currentFiles
  .map((file) => {
    const key = path.basename(file, path.extname(file));
    return `import * as ${key} from '../languages/${file}';`;
  })
  .join('\n');

const languageObjectEntries = currentFiles
  .map((file) => {
    const key = path.basename(file, path.extname(file));
    return `  ${key}: ${key},`;
  })
  .join('\n');

const languageOptions = currentFiles
  .map((file) => {
    const key = path.basename(file, path.extname(file));
    return `  { key: '${key}', name: ${key}.name, nativeName: ${key}.nativeName },`;
  })
  .join('\n');

const content = `// This file is generated automatically by the generate-lang-imports script. Do not modify it manually.

${imports}

const languages: any = {
${languageObjectEntries}
};

export const languageOptions = [
${languageOptions}
];

export { languages };
`;

fs.writeFileSync(outputFilePath, content);

console.log('Language imports generated successfully.');

// Log files that were removed
if (filesToRemove.length > 0) {
  console.log('Removed files:', filesToRemove);
}
