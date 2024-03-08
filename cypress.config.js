const { defineConfig } = require("cypress");

module.exports = defineConfig({
  component: {
    fixturesFolder: "cypress/fixtures",
    integrationFolder: "cypress/integration",
    pluginsFile: "cypress/plugins/index.js",
    screenshotsFolder: "cypress/screenshots",
    supportFile: "cypress/support/e2e.js",
    videosFolder: "cypress/videos"
  },
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: "http://localhost:3000",
    fixturesFolder: "cypress/fixtures",
    screenshotsFolder: "cypress/screenshots",
    specPattern: [
      "cypress/integration/*.cy.js"
    ],
    supportFile: "cypress/support/e2e.js",
    viewportWidth: 1000,
    viewportHeight: 1200
  },
});
