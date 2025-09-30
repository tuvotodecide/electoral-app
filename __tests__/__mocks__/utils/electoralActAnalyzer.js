module.exports = {
  analyzeElectoralAct: jest.fn(async () => ({
    success: true,
    data: {if_electoral_act: true, image_not_clear: false},
  })),
  mapToAppFormat: jest.fn(() => ({mapped: true})),
};
