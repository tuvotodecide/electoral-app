import React from 'react';
import {render} from '@testing-library/react-native';
import ZoomablePhoto from '../../../../src/components/common/ZoomablePhoto';

describe('ZoomablePhoto', () => {
  it('renderiza sin errores', () => {
    const {toJSON} = render(<ZoomablePhoto photoUri="file://photo.jpg" />);
    expect(toJSON()).toBeTruthy();
  });
});
