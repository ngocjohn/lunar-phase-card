/* eslint-disable */
const fs = require('fs');
const path = require('path');

// Paths
const translationsDir = path.join(__dirname, '../src/languages');
const missingTranslationsPath = path.join(__dirname, 'translated-missing.json');

// Read missing translations JSON
const missingTranslations = JSON.parse(fs.readFileSync(missingTranslationsPath, 'utf8'));

// Function to update language files
const updateLanguageFiles = () => {
  Object.entries(missingTranslations).forEach(([languageFile, translations]) => {
    const languageFilePath = path.join(translationsDir, languageFile);

    // Check if the language file exists
    if (fs.existsSync(languageFilePath)) {
      // Read the language file content
      const languageData = JSON.parse(fs.readFileSync(languageFilePath, 'utf8'));

      // Add missing translations
      translations.forEach(({ key, value }) => {
        const keyParts = key.split('.');

        // Add the nested keys and values to the language JSON file
        let current = languageData;
        keyParts.forEach((part, index) => {
          if (index === keyParts.length - 1) {
            current[part] = value; // Add the value at the final key
          } else {
            current = current[part] = current[part] || {}; // Continue nesting
          }
        });
      });

      // Write the updated data back to the language file
      fs.writeFileSync(languageFilePath, JSON.stringify(languageData, null, 2), 'utf8');
      console.log(`Updated ${languageFile}`);
    } else {
      console.log(`Language file ${languageFile} not found.`);
    }
  });
};

// Run the script
updateLanguageFiles();
