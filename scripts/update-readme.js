const fs = require('fs');
const path = require('path');

// Define paths
const readmePath = path.join(__dirname, '../README.md');
const languagesFolder = path.join(__dirname, '../src/languages');

const currentFiles = fs.readdirSync(languagesFolder).filter((file) => file.endsWith('.json'));

const codeWidth = 10;
const nameWidth = 24;

// Detects CJK characters (Chinese, Japanese, Korean)
function containsCJK(str) {
  return /[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/.test(str);
}

// Function to get language data from JSON files
function languages() {
  const languages = [];
  currentFiles.forEach((file) => {
    const filePath = path.join(languagesFolder, file);
    const langCode = path.basename(file, '.json');

    if (path.extname(file) === '.json') {
      const langData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      languages.push({ code: `${langCode}`, name: langData.name, nativeName: langData.nativeName });
    }
  });
  return languages;
}

function padCell(str, targetWidth, applyCJKFix = false) {
  let width = str.length;

  if (applyCJKFix && containsCJK(str)) {
    width -= 1;
  }

  let padding = Math.round(targetWidth - width);
  if (padding < 0) padding = 0;

  let result = str + ' '.repeat(padding);

  // Final safety net — ensure not under target
  while (result.length < targetWidth) {
    result += ' ';
  }
  // Avoid overshooting (rare edge case)
  while (result.length > targetWidth) {
    result = result.slice(0, -2);
  }

  return result;
}
// Function to create table header
function getTableHeader() {
  const codeCol = padCell('Lange Code', codeWidth + 2); // +2 for backticks
  const nameCol = padCell('Name', nameWidth);
  const nativeCol = padCell('Native Name', nameWidth, true);
  return `| ${codeCol} | ${nameCol} | ${nativeCol} |\n|${'-'.repeat(codeWidth + 4)}|${'-'.repeat(nameWidth + 2)}|${'-'.repeat(nameWidth + 2)}|`;
}

function getLanguageTable(languages) {
  const rows = languages.map((lang) => {
    const code = padCell(`\`${lang.code}\``, codeWidth + 2); // +2 for backticks
    const name = padCell(lang.name, nameWidth);
    const native = padCell(lang.nativeName, nameWidth, true);
    return `| ${code} | ${name} | ${native} |`;
  });
  return rows.join('\n');
}

// Function to update the README
const updateReadme = () => {
  const readmeContent = fs.readFileSync(readmePath, 'utf8');

  // Find the localization section in the README
  const startMarker = '<!--LOCALIZATION-CONTENT-START-->';
  const endMarker = '<!--LOCALIZATION-CONTENT-END-->';
  const startMarkerIndex = readmeContent.indexOf(startMarker);
  const endMarkerIndex = readmeContent.indexOf(endMarker);

  if (startMarkerIndex === -1 || endMarkerIndex === -1) {
    console.error('Localization section not found in README.md');
    return;
  }
  // Generate the new table from the language files
  const langs = languages();
  const newTableRows = getLanguageTable(langs);
  const tableHeader = getTableHeader();

  const newLocalizationSection = `
### Supported Localization

<details>
  <summary>The following languages are supported in this project</summary>

${tableHeader}
${newTableRows}

</details>`;

  // Replace the old localization section with the new one
  const updatedReadme =
    readmeContent.slice(0, startMarkerIndex + startMarker.length) +
    '\n' +
    newLocalizationSection +
    '\n' +
    readmeContent.slice(endMarkerIndex);

  // Write the updated README back to the file
  fs.writeFileSync(readmePath, updatedReadme, 'utf8');

  console.log('README.md updated successfully!');
};

// function to read the README and extract language codes from the table
function readLangCodesFromReadme() {
  const content = fs.readFileSync(readmePath, 'utf8');

  // Extract content between markers
  const matches = content.match(/<!--LOCALIZATION-CONTENT-START-->([\s\S]*?)<!--LOCALIZATION-CONTENT-END-->/m);

  if (!matches) {
    console.error('Markers not found in README.md');
    return;
  }

  const tableSection = matches[1];

  // Extract lines that look like Markdown table rows
  const codeLines = tableSection
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && line.includes('|'));

  // console.log(codeLines);

  // Remove the header and separator rows
  const dataRows = codeLines.slice(2); // skip header and separator

  const langCodes = dataRows.map((row) => {
    const cells = row.split('|').map((cell) => cell.trim());
    const code = cells[1]; // first column (index 1, because index 0 is empty from split)
    return code.replace(/`/g, ''); // remove backticks
  });

  return langCodes;
}

// Check for updates to README if there are new languages
function checkForReadmeUpdate() {
  const readmeLangs = readLangCodesFromReadme();
  const currentLangs = languages().map((lang) => lang.code);

  // Compare the two arrays
  const readmeSet = new Set(readmeLangs);
  const currentSet = new Set(currentLangs);

  let hasChanges = false;

  // Check for additions
  for (const lang of currentSet) {
    if (!readmeSet.has(lang)) {
      console.log(`Language added: ${lang}`);
      hasChanges = true;
    }
  }

  // Check for removals
  for (const lang of readmeSet) {
    if (!currentSet.has(lang)) {
      console.log(`Language removed: ${lang}`);
      hasChanges = true;
    }
  }

  if (hasChanges) {
    console.log('README.md needs to be updated.');
    updateReadme();
  } else {
    console.log('No changes detected. README.md is up to date.');
    return;
  }
}

checkForReadmeUpdate();
