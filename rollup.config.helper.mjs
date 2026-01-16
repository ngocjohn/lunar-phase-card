import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import image from '@rollup/plugin-image';
import postcss from 'rollup-plugin-postcss';
import postcssPresetEnv from 'postcss-preset-env';
import postcssLit from 'rollup-plugin-postcss-lit';

import { description, repository } from './package.json';

// pad string to target width with spaces to center it
function pad(str, targetWidth) {
  let width = str.length;
  let totalPadding = Math.round(targetWidth - width);
  if (totalPadding < 0) totalPadding = 0;

  let leftPadding = Math.floor(totalPadding / 2);
  let rightPadding = Math.ceil(totalPadding / 2);
  let result = ' '.repeat(leftPadding) + str + ' '.repeat(rightPadding);

  // Final safety net — ensure not under target
  while (result.length < targetWidth) {
    result = ' ' + result + ' ';
  }
  // Avoid overshooting (rare edge case)
  while (result.length > targetWidth) {
    result = result.slice(1, -1);
  }
  return result;
}

function padByWidth(str) {
  const strWidth = str.length;
  // add 3 spaces to each side
  const targetWidth = strWidth + 8;
  return pad(str, targetWidth);
}
const styles = {
  gradient: '#4b6cb7, #182848',
  border: '#4b6cb7',
};

export function logCardInfo(version) {
  const part1 = '🌒  LUNAR-PHASE-CARD  🌃';
  const part2 = `· ${version} ·`;

  const { gradient, border } = styles;

  const part1Gradient = `background: linear-gradient(90deg, ${gradient});color: #ffffff;`;
  const part2Gradient = `background: linear-gradient(-90deg, ${gradient});color: #FFFFFF90;`;
  const sharedStyle = `padding: 2px 0px; border: 0.5px solid; text-shadow: 0 2px 2px rgba(1, 1, 1, 0.2); font-family: Roboto,Verdana,Geneva,sans-serif; border-color: ${border};`;

  const part1Style = `${part1Gradient}${sharedStyle}border-right: none; border-radius: 6px 0 0 6px;`;
  const part2Style = `${part2Gradient}${sharedStyle};border-left: none; border-radius: 0 6px 6px 0;`;

  const repo = `Github: ${repository.url}`;
  const sponsor = 'If you like the card, consider supporting the developer: https://github.com/sponsors/ngocjohn';

  return `
    console.groupCollapsed(
      "%c${padByWidth(part1)}%c${padByWidth(part2)}",
      '${part1Style}',
      '${part2Style}',
    );
    console.info('${description}');
    console.info('${repo}');
    console.info('${sponsor}');
    console.groupEnd();
  `;
}

export const defaultPlugins = [
  typescript(),
  nodeResolve(),
  json(),
  commonjs(),
  image(),
  babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**',
  }),
  postcss({
    plugins: [
      postcssPresetEnv({
        stage: 1,
        features: {
          'nesting-rules': true,
        },
      }),
    ],
    extract: false,
    inject: false,
  }),
  postcssLit(),
];
