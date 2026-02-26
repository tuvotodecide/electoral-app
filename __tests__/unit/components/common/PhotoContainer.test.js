import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {PhotoContainer} from '../../../../src/components/common/PhotoContainer';
import {renderWithProviders} from '../../../setup/test-utils';

jest.mock('react-native-image-pan-zoom', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({children}) => React.createElement('View', null, children),
  };
});

describe('PhotoContainer', () => {
  it('renderiza imagen sin zoom', () => {
    const RN = require('react-native');
    RN.Image.getSize = jest.fn((uri, success) => success(100, 200));
    const {getByTestId} = renderWithProviders(
      <PhotoContainer testID="photo" photoUri="ipfs://cid" />,
    );
    expect(getByTestId('photoImage')).toBeTruthy();
  });

  it('renderiza modo zoom y botones de rotacion', () => {
    const RN = require('react-native');
    RN.Image.getSize = jest.fn((uri, success) => success(100, 200));
    const {getByTestId} = renderWithProviders(
      <PhotoContainer testID="zoom" photoUri="ipfs://cid" enableZoom={true} />,
    );
    expect(getByTestId('zoomRotateLeft')).toBeTruthy();
    expect(getByTestId('zoomRotateRight')).toBeTruthy();
  });

  it('avanza al siguiente candidato cuando falla la imagen', async () => {
    const cid = 'bafybeigdyrzt2ytv6d6p2k7s7r5z6s2m2m2m2m2m2m2m2m2m2';
    const {getByTestId} = renderWithProviders(
      <PhotoContainer testID="photo" photoUri={`ipfs://${cid}`} />,
    );
    const firstUri = getByTestId('photoImage').props.source.uri;
    expect(firstUri).toContain('ipfs.io/ipfs');

    fireEvent(getByTestId('photoImage'), 'error');

    await waitFor(() => {
      const nextUri = getByTestId('photoImage').props.source.uri;
      expect(nextUri).toContain('cloudflare-ipfs.com');
    });
  });

  it('rota la imagen en modo zoom', async () => {
    const RN = require('react-native');
    RN.Image.getSize = jest.fn((uri, success) => success(100, 200));
    const cid = 'bafybeigdyrzt2ytv6d6p2k7s7r5z6s2m2m2m2m2m2m2m2m2m2';
    const {getByTestId} = renderWithProviders(
      <PhotoContainer
        testID="zoom"
        photoUri={`ipfs://${cid}`}
        enableZoom={true}
      />,
    );

    fireEvent(getByTestId('zoom'), 'layout', {
      nativeEvent: {layout: {width: 200, height: 200}},
    });

    await waitFor(() => expect(getByTestId('zoomImage')).toBeTruthy());
    const initialRotate =
      getByTestId('zoomImage').props.style.transform[0].rotate;
    expect(initialRotate).toBe('0deg');

    fireEvent.press(getByTestId('zoomRotateRight'));
    const rotated =
      getByTestId('zoomImage').props.style.transform[0].rotate;
    expect(rotated).toBe('90deg');
  });
});
