export default {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  moduleNameMapper: {
    // Mock CSS/static files
    "\\.(css|less|scss|sass|svg|png|jpg|jpeg|gif|webp)$": "identity-obj-proxy",
  },
  testMatch: ["**/?(*.)+(test).js?(x)"],
};
