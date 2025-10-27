import React from 'react';

const MockIcon = ({ name, size = 24, color = '#000', style, onPress, testID }) => {
  return React.createElement('Text', {
    testID: testID || `icon-${name}`,
    style: [{ fontSize: size, color }, style],
    onPress,
    children: name,
  });
};

MockIcon.loadFont = jest.fn(() => Promise.resolve());
MockIcon.hasIcon = jest.fn(() => Promise.resolve(true));
MockIcon.getImageSource = jest.fn(() => Promise.resolve({ uri: 'mocked' }));
MockIcon.getRawGlyphMap = jest.fn(() => ({}));

export default MockIcon;
