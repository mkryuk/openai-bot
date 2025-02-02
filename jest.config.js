module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: false,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/main.ts", // Exclude entry file
    "!dist/**", // Exclude build directory
  ],
  coveragePathIgnorePatterns: ["/node_modules/", "/test/"],
  coverageReporters: ["text", "lcov"], // Specify coverage reporters
};
``;
