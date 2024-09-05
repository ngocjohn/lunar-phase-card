const fs = require('fs');
const path = require('path');

// Define paths
const readmePath = path.join(__dirname, '../README.md');
const languagesFolder = path.join(__dirname, '../src/languages');

// Function to update the README
const updateReadme = () => {
  const readmeContent = fs.readFileSync(readmePath, 'utf8');

  // Find the localization section in the README
  const startMarker = '### Supported Localization';
  const endMarker = '</details>';
  const startIndex = readmeContent.indexOf(startMarker);
  const endIndex = readmeContent.indexOf(endMarker) + endMarker.length;

  if (startIndex === -1 || endIndex === -1) {
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

| Language Code | Name                   | Native Name					  |
| ------------- | ---------------------- | ---------------------- |
${newTableRows}

</details>`;

  // Replace the old localization section with the new one
  const updatedReadme = `${readmeContent.slice(0, startIndex)}${newLocalizationSection}${readmeContent.slice(endIndex)}`;

  // Write the updated README back to the file
  fs.writeFileSync(readmePath, updatedReadme, 'utf8');

  console.log('README.md updated successfully!');
};

// Run the script
updateReadme();
