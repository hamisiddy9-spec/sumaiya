// jest-expo has no built-in mock for this third-party native module (unlike
// the expo-* packages it ships mocks for). Placing this file at
// <rootDir>/__mocks__/<module-name>.js auto-mocks it for every test — no
// per-test jest.mock() call needed.
module.exports = {
  captureRef: jest.fn(async () => "file:///mock-screenshot.jpg"),
};
