const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer to be inside the project folder
  // so that Render will include it in the deployed application files.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
