/* global URL, console, process */

import { readFileSync, writeFileSync } from 'node:fs';

const version = process.argv[2];

if (!version) {
  console.error('Usage: node scripts/sync-chart-version.mjs <version>');
  process.exit(1);
}

const chartPath = new URL('../chart/Chart.yaml', import.meta.url);
const currentChart = readFileSync(chartPath, 'utf8');

const nextChart = currentChart.replace(
  /^appVersion:\s*.*$/m,
  `appVersion: "v${version}"`,
);

if (nextChart === currentChart) {
  console.error('Unable to update chart/Chart.yaml version fields.');
  process.exit(1);
}

writeFileSync(chartPath, nextChart);
