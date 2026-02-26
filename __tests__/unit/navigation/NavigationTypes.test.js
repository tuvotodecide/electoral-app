import React from 'react';
import {renderWithProviders} from '../../setup/test-utils';

const mockComponent = () => null;

jest.mock('../../../src/navigation/NavigationRoute', () => {
  const handler = {
    get: () => mockComponent,
  };
  return {
    StackRoute: new Proxy({}, handler),
    AuthRoute: new Proxy({}, handler),
    TabRoute: new Proxy({}, handler),
  };
});

jest.mock('../../../src/container/TabBar/Home/HomeScreen', () => mockComponent);
jest.mock('../../../src/container/Vote/UploadRecord/CameraScreen', () => mockComponent);
jest.mock('../../../src/container/Vote/UploadRecord/CameraPermissionTest', () => mockComponent);
jest.mock('../../../src/utils/Session', () => ({
  isSessionValid: jest.fn(() => Promise.resolve(true)),
  refreshSession: jest.fn(() => Promise.resolve()),
}));

import AuthNavigation from '../../../src/navigation/type/AuthNavigation';
import HomeStackNavigation from '../../../src/navigation/type/HomeStackNavigation';
import StackNavigation from '../../../src/navigation/type/StackNavigation';
import StackNavigationClean from '../../../src/navigation/type/StackNavigationClean';
import TabNavigation from '../../../src/navigation/type/TabNavigation';
import VoteStackNavigation from '../../../src/navigation/type/VoteStackNavigation';

describe('Navigation type components', () => {
  it('renderiza AuthNavigation', () => {
    expect(() => renderWithProviders(<AuthNavigation />)).not.toThrow();
  });

  it('renderiza HomeStackNavigation', () => {
    expect(() => renderWithProviders(<HomeStackNavigation />)).not.toThrow();
  });

  it('renderiza StackNavigation', () => {
    expect(() => renderWithProviders(<StackNavigation />)).not.toThrow();
  });

  it('renderiza StackNavigationClean', () => {
    expect(() => renderWithProviders(<StackNavigationClean />)).not.toThrow();
  });

  it('renderiza VoteStackNavigation', () => {
    expect(() => renderWithProviders(<VoteStackNavigation />)).not.toThrow();
  });

  it('renderiza TabNavigation', () => {
    expect(() => renderWithProviders(<TabNavigation />)).not.toThrow();
  });
});
