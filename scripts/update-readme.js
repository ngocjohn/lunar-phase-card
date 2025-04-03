const fs = require('fs');
const path = require('path');

// Define paths
const readmePath = path.join(__dirname, '../README.md');
const languagesFolder = path.join(__dirname, '../src/languages');

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
  const languages = [];
  const files = fs.readdirSync(languagesFolder);

  files.forEach((file) => {
    const filePath = path.join(languagesFolder, file);
    const langCode = path.basename(file, '.json');

    if (path.extname(file) === '.json') {
      const langData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      languages.push({ code: `${langCode}`, name: langData.name, nativeName: langData.nativeName });
    }
  });

  // Create the new language table
  const newTableRows = languages
    .map((lang) => `| \`${lang.code}\`     | ${lang.name}          | ${lang.nativeName}          |`)
    .join('\n');

  const newLocalizationSection = `
### Supported Localization

<details>
  <summary>The following languages are supported in this project</summary>

| Language Code | Name                   | Native Name            |
| ------------- | ---------------------- | ---------------------- |
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

// Run the script
updateReadme();
