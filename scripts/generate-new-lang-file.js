const fs = require('fs');
const path = require('path');
const JSON5 = require('json5'); // Require json5

// Function to replace the value of a specific key with the language name
const replaceLanguageName = (data, langName) => {
  for (let key in data) {
    if (typeof data[key] === 'object' && data[key] !== null) {
      replaceLanguageName(data[key], langName);
    } else if (key === 'name') {
      // Assuming the key to be replaced is 'name'
      data[key] = langName;
    }
  }
};

// Main function to generate new language file
const generateLangFile = (baseFilePath, newFilePath, langName) => {
  // Load the base string.json file
  const baseData = JSON5.parse(fs.readFileSync(baseFilePath, 'utf8')); // Use JSON5.parse

  // Replace the value of the 'name' key with the language name
  replaceLanguageName(baseData, langName);

  // Write the updated data to the new language file
  fs.writeFileSync(newFilePath, JSON.stringify(baseData, null, 4), 'utf8');
  console.log(`Generated ${newFilePath} with the language name "${langName}".`);
};

// Parse command-line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: node generate_lang.js <filename.json> <langName>');
  process.exit(1);
}

const [newFileName, langName] = args;
const baseFilePath = path.resolve(__dirname, '../src/localize/string.json');
const newFilePath = path.resolve(__dirname, `../src/languages/${newFileName}`);

// Generate the new language file
generateLangFile(baseFilePath, newFilePath, langName);
