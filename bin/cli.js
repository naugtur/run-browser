#!/usr/bin/env node

'use strict';
var process = require('process');
var console = require('console');
var parseArgs = require('minimist');
var fmt = require('util').format;

var runbrowser = require('../index.js');

var args = parseArgs(process.argv.slice(2));

var filename = args._[0];
var port = Number(args.p || args.port) || 3000;
var help = args.help || args.h || args._.length === 0;
var chromium = args.b || args.chromium || args.puppeteer;
var report = args.p || args.report || args.istanbul;
var debug = args.d || args.debug;
var timeout = args.t || args.timeout || Infinity;
var mockserver = args.m || args.mock;

if (help) {
  var helpText = [
    '',
    'Usage:',
    '  run-browser <file> <options>',
    '',
    'Options:',
    '  -p --port <number> The port number to run the server on (default: 3000)',
    '  -b --chromium       Use the chromium headless browser to run tests and then exit with the correct status code (if tests output TAP)',
    '  -r --report        Generate coverage Istanbul report. Repeat for each type of coverage report desired. (default: text only)',
    '  -t --timeout       Global timeout in milliseconds for tests to finish. (default: Infinity)',
    '  -m --mock          Include given JS file and use for handling requests to /mock*',
    '',
    'Example:',
    '  run-browser test-file.js --port 3030 --report text --report html --report=cobertura',
    ''
  ].join('\n');
  console.log(helpText);
  process.exit(process.argv.length === 3 ? 0 : 1);
}

var server = runbrowser(filename, report, chromium, mockserver);
server.listen(port);


if (!chromium) {
  console.log('Open a browser and navigate to "http://localhost:' + port + '"');
} else {
(async () => {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:' + port + '/');
  page.on('console', msg => console.log(msg.text()));

  if (timeout < Infinity) {
    setTimeout(async function() {
      console.log(fmt('Timeout of %dms exceeded', timeout));
      await browser.close();
      server.close();
    }, timeout);
  }
})()
}
