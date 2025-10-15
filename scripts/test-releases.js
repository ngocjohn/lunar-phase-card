const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Paths
const bugTemplatePath = path.join(__dirname, '../.github/ISSUE_TEMPLATE/BUG_REPORT.yml');

// Check if the current tags are different from the new tags
const isDifferent = (currentTags, newTags) => {
  return newTags.some((tag) => !currentTags.includes(tag));
};

module.exports = async ({ github, context }) => {
  const repo = context.repo;
  const releasesList = await github.rest.repos.listReleases({
    owner: repo.owner,
    repo: repo.repo,
  });
  const tags = releasesList.data.filter((release) => !release.draft).map((release) => release.tag_name);

  // Read the current bug report template
  const bugTemplateContent = fs.readFileSync(bugTemplatePath, 'utf8');
  const doc = yaml.load(bugTemplateContent);

  // Find the version dropdown field
  const versionField = doc.body.find((field) => field.id === 'version');

  if (versionField && versionField.attributes && Array.isArray(versionField.attributes.options)) {
    const currentTags = versionField.attributes.options;

    if (!isDifferent(currentTags, tags)) {
      console.log(currentTags, tags);
      console.log('No changes in tags. Exiting.');
      return false;
    }
    console.log('Tags have changed');
    // log the changes
    console.log('Current Tags:', currentTags);
    console.log('New Tags:', tags);

    return true;
  } else {
    return false;
  }
};
