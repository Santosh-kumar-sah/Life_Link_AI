export default {
  transform: {},
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/config/*.js"
  ],
  coverageDirectory: "coverage",
  testTimeout: 10000,
  clearMocks: true
};
