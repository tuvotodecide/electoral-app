module.exports = {
  useNavigationLogger: jest.fn(() => ({
    logAction: jest.fn(),
    logNavigation: jest.fn(),
  })),
};
