# Contribution Guidelines for Translations

Welcome to the translation contribution guide! This document will help you contribute translations to our project. Follow these steps to generate new language files, update existing translations, and ensure everything is in sync with the base source.

## Table of Contents

1. [Preparing a Setup](#preparing-a-setup)
1. [Generating a New Language File](#generating-a-new-language-file)
1. [Updating Translation Keys](#updating-translation-keys)
1. [Contributing to the GitHub Repository](#contributing-to-the-github-repository)

## Preparing a setup

1. **Fork the Repository**:

   - Go to the repository on GitHub.
   - Click the `Fork` button in the upper right corner of the page.
   - This will create a copy of the repository in your GitHub account.

2. **Clone Your Fork**:

   - Open your terminal.
   - Clone your fork to your local machine using the following command:

     ```sh
     git clone https://github.com/your-username/lunar-phase-card.git
     ```

## Generating a New Language File

To generate a new language file, follow these steps:

1. **First, download npm modules**:

   ```sh
    npm install
   ```

2. **Navigate to the Scripts Directory**:

   ```sh
    cd scripts
   ```

3. **Run the Generate Script**:
   Use the following command to generate a new language file. Replace `fr.json` with the desired language code and `French` with the language name.

   ```sh
    node generate-new-lang-file.js fr.json French
   ```

3. **Add Translations**:
   Open the newly created file in the `src/languages` directory and add the translations for your language.

## Updating Translation Keys

When new keys are added to the base `string.json`, you need to update the language files:

1. **First, download npm modules**:

   ```sh
    npm install
   ```
   
2. **Navigate to the Scripts Directory**:

   ```sh
    cd scripts
   ```

3. **Run the Update Script**:
   This script will add any missing keys to your language files and set their values to an empty string. It will also remove keys that are no longer present in the base `string.json`.

   ```sh
    node update-languages.js
   ```

   If you want to update a specific language file, you can provide the file name as an argument:

   ```sh
   node update-languages.js fr.json
   ```

4. **Review Missing Translations**:

   After running the script, a file named `missing_translations.json` will be created in the `scripts` directory.

   The `missing_translations.json` file contains the keys and values that are missing in the specified language files. Each entry in the JSON object represents a language file and lists the missing keys along with their corresponding values from the base `string.json` file.

   Here is an example of the `missing_translations.json` file, with missing keys in `cs.json` and `sk.json`:

   ```json
   {
     "cs.json": [
       {
         "key": "editor.viewConfig.title",
         "value": "Language and view mode"
       }
     ],
     "sk.json": [
       {
         "key": "card.phase.waxingCrescentMoon",
         "value": "Waxing crescent"
       }
     ]
   }
   ```

   Each missing key is represented by an object containing:

   • `key`: The full key path of the missing translation

   • `value`: The English (or base language) value that needs to be translated.

5. **Add Missing Translations**:

   Open the language files in the `src/languages` directory and add the missing translations.
   Use the `missing_translations.json` file as a reference to see which keys need to be translated.

## Contributing to the GitHub Repository

To contribute changes to the source repository, follow these steps:

1. **Create a New Branch**:

   - Before making any changes, create a new branch in your local repository. This will isolate your changes from the main branch.
   - Use the following command to create a new branch:

     ```sh
     git checkout -b localization-french-branch
     ```

2. **Make Your Changes**:

   - Open the relevant files in your preferred text editor and make the necessary changes.

3. **Commit Your Changes**:

   - Once you have made your changes, commit them to your local branch.
   - Use the following command to commit your changes:

     ```sh
     git commit -m "Add description of your changes"
     ```

4. **Push Your Changes**:

   - After committing your changes, push them to your forked repository on GitHub.
   - Use the following command to push your changes:

     ```sh
     git push origin localization-french-branch
     ```

5. **Create a Pull Request**:

   - Go to the original repository on GitHub and navigate to the `Pull Requests` tab.
   - Click on the `New Pull Request` button.
   - Select your branch from the `base` dropdown and the main branch from the `compare` dropdown.
   - Add a descriptive title and detailed description for your pull request.
   - Click on the `Create Pull Request` button to submit your changes for review.

6. **Review and Address Feedback**:

   - Wait for the project maintainers to review your pull request.
   - Address any feedback or comments provided by the reviewers.
   - Make the necessary changes and push them to your branch.

7. **Merge Your Changes**:

   - Once your pull request has been approved, it will be merged into the main branch.
   - Congratulations! Your changes are now part of the source repository. :tada:

   Remember to keep your branch up to date with the main branch by regularly pulling the latest changes and resolving any conflicts that may arise.
