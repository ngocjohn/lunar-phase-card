const fs = require('fs');
const path = require('path');
const JSON5 = require('json5');

const baseFilePath = path.resolve(__dirname, '../src/localize/string.json');
const baseData = JSON5.parse(fs.readFileSync(baseFilePath, 'utf8'));

const getDiff = (base, target, prefix = '') => {
  let missingKeys = [];
  let emptyKeys = [];
  let extraKeys = [];

  for (let key in base) {
    if (!(key in target)) {
      missingKeys.push(`${prefix}${key}`);
    } else if (typeof base[key] === 'object' && base[key] !== null) {
      const [nestedMissing, nestedEmpty, nestedExtra] = getDiff(base[key], target[key], `${prefix}${key}.`);
      missingKeys = missingKeys.concat(nestedMissing);
      emptyKeys = emptyKeys.concat(nestedEmpty);
      extraKeys = extraKeys.concat(nestedExtra);
    } else if (target[key] === undefined || target[key] === '') {
      emptyKeys.push(`${prefix}${key}`);
    }
  }

  for (let key in target) {
    if (!(key in base)) {
      extraKeys.push(`${prefix}${key}`);
    }
  }

  return [missingKeys, emptyKeys, extraKeys];
};

const langFiles = process.argv.slice(2);

let hasIssues = false;
let report = '';

for (const file of langFiles) {
  const langFilePath = path.resolve(__dirname, '..', file);
  const langData = JSON5.parse(fs.readFileSync(langFilePath, 'utf8'));

  const [missingKeys, emptyKeys, extraKeys] = getDiff(baseData, langData);

  if (missingKeys.length > 0 || emptyKeys.length > 0 || extraKeys.length > 0) {
    report += `### Issues in \`${path.basename(file)}\`:\n`;

    if (missingKeys.length > 0) {
      hasIssues = true;
      report += `#### Missing keys:\n`;
      report += missingKeys.map((key) => `- ${key}`).join('\n') + '\n';
    }

    if (emptyKeys.length > 0) {
      hasIssues = true;
      report += `#### Empty keys:\n`;
      report += emptyKeys.map((key) => `- ${key}`).join('\n') + '\n';
    }

    if (extraKeys.length > 0) {
      hasIssues = true;
      report += `#### Extra keys:\n`;
      report += extraKeys.map((key) => `- ${key}`).join('\n') + '\n';
    }

    report += '\n';
  }
}

if (hasIssues) {
  fs.writeFileSync(path.join(__dirname, 'diff-report.md'), report);
  // Write to the GITHUB_ENV file to set the hasIssues variable
  fs.appendFileSync(process.env.GITHUB_ENV, `hasIssues=true\n`);
}
