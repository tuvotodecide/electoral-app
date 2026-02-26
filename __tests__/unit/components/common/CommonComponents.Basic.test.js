import React from 'react';
import {Text, TouchableOpacity} from 'react-native';
import {fireEvent, render} from '@testing-library/react-native';
import {renderWithProviders} from '../../../setup/test-utils';
import ActionButtons from '../../../../src/components/common/ActionButtons';
import CCardRed from '../../../../src/components/common/CCardRed';
import CCardsRow from '../../../../src/components/common/CCardsRow';
import CCollapse from '../../../../src/components/common/CCollapse';
import {CCopyIcon} from '../../../../src/components/common/CCopyIcon';
import CDivider from '../../../../src/components/common/CDivider';
import CHash from '../../../../src/components/common/CHash';
import CIconButton from '../../../../src/components/common/CIconButton';
import COptionItem from '../../../../src/components/common/COptionItem';
import CPagination from '../../../../src/components/common/CPagination';
import CStandardHeader from '../../../../src/components/common/CStandardHeader';
import CTagText from '../../../../src/components/common/CTagText';
import CTransferRowCard from '../../../../src/components/common/CTransferRowCard';
import CUserCard from '../../../../src/components/common/CUserCard';
import CLoaderOverlay from '../../../../src/components/common/CLoaderOverlay';
import CBigAlert from '../../../../src/components/common/CBigAlert';
import CEtiqueta from '../../../../src/components/common/CEtiqueta';
import CListCard from '../../../../src/components/common/CLIstCard';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

jest.mock('react-native-paper', () => {
  const React = require('react');
  return {
    Divider: ({style}) => React.createElement('Divider', {style}),
  };
});

const themeState = {
  theme: {
    primary: '#459151',
    primaryTransparent: 'rgba(69,145,81,0.1)',
    grayScale50: '#F8F9FA',
    grayScale60: '#E5E7EB',
    grayScale200: '#E5E7EB',
    grayScale300: '#D1D5DB',
    grayScale500: '#6B7280',
    grayScale700: '#374151',
    textColor: '#111827',
    inputBackground: '#FFFFFF',
    background: '#FFFFFF',
    success: '#10B981',
    white: '#FFFFFF',
    dark: false,
    black: '#000000',
  },
};

const renderWithTheme = (ui) =>
  renderWithProviders(ui, {initialState: {theme: themeState}});

describe('componentes comunes básicos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ActionButtons renderiza y ejecuta onPress', () => {
    const onPress = jest.fn();
    const {getByTestId} = renderWithTheme(
      <ActionButtons
        testID="actions"
        buttons={[
          {text: 'Uno', onPress, testID: 'btn-1'},
          {text: 'Dos', onPress: jest.fn(), testID: 'btn-2'},
        ]}
      />,
    );
    fireEvent.press(getByTestId('btn-1'));
    expect(onPress).toHaveBeenCalled();
  });

  it('CCardRed muestra título y subtítulo', () => {
    const {getByText} = renderWithTheme(
      <CCardRed
        imageSource={{uri: 'img'}}
        title="Titulo"
        subtitle="Sub"
        leftAmount="10"
        rightText="OK"
      />,
    );
    expect(getByText('Titulo')).toBeTruthy();
    expect(getByText('Sub')).toBeTruthy();
  });

  it('CCardsRow renderiza children', () => {
    const {getByText} = render(<CCardsRow><Text>Child</Text></CCardsRow>);
    expect(getByText('Child')).toBeTruthy();
  });

  it('CCollapse alterna contenido', () => {
    const {queryByText, getByText, UNSAFE_getAllByType} = renderWithTheme(
      <CCollapse title="Titulo">
        <Text>Contenido</Text>
      </CCollapse>,
    );
    expect(queryByText('Contenido')).toBeNull();
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[0]);
    expect(getByText('Contenido')).toBeTruthy();
  });

  it('CCopyIcon copia al portapapeles', async () => {
    const clipboard = require('expo-clipboard');
    const {UNSAFE_getByType} = renderWithTheme(<CCopyIcon copyValue="abc" />);
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(clipboard.setStringAsync).toHaveBeenCalledWith('abc');
  });

  it('CDivider renderiza sin romper', () => {
    const {toJSON} = renderWithTheme(<CDivider />);
    expect(toJSON()).toBeTruthy();
  });

  it('CHash copia y muestra toast', () => {
    jest.useFakeTimers();
    const clipboard = require('expo-clipboard');
    const {getByTestId} = renderWithTheme(
      <CHash testID="hash" title="0xabc" text="0xabc" />,
    );
    fireEvent.press(getByTestId('hash'));
    expect(clipboard.setStringAsync).toHaveBeenCalledWith('0xabc');
    jest.advanceTimersByTime(1);
    jest.useRealTimers();
  });

  it('CIconButton ejecuta onPress y vuelve al estado', async () => {
    jest.useFakeTimers();
    const onPress = jest.fn(() => Promise.resolve());
    const {UNSAFE_getByType} = renderWithTheme(
      <CIconButton name="check" onPress={onPress} />,
    );
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onPress).toHaveBeenCalled();
    jest.advanceTimersByTime(1500);
    jest.useRealTimers();
  });

  it('COptionItem con switch dispara onSwitchValueChange', () => {
    const onSwitchValueChange = jest.fn();
    const {getByTestId} = renderWithTheme(
      <COptionItem
        item={{id: 1, rightIcon: 'switch', icon: 'info', title: 'T', value: 'V'}}
        index={0}
        switchValue={false}
        onSwitchValueChange={onSwitchValueChange}
        onPressItem={jest.fn()}
      />,
    );
    fireEvent(getByTestId('optionSwitch_1'), 'valueChange', true);
    expect(onSwitchValueChange).toHaveBeenCalled();
  });

  it('COptionItem menú dispara onPressItem', () => {
    const onPressItem = jest.fn();
    const {getByTestId} = renderWithTheme(
      <COptionItem
        item={{id: 2, rightIcon: 'arrow', icon: 'info', title: 'T', value: 'V'}}
        index={0}
        switchValue={false}
        onSwitchValueChange={jest.fn()}
        onPressItem={onPressItem}
      />,
    );
    fireEvent.press(getByTestId('optionMenuItem_2'));
    expect(onPressItem).toHaveBeenCalled();
  });

  it('CPagination cambia página', () => {
    const onPageChange = jest.fn();
    const {getByText} = render(<CPagination totalPages={3} currentPage={1} onPageChange={onPageChange} />);
    fireEvent.press(getByText('2'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('CStandardHeader usa onPressBack', () => {
    const onPressBack = jest.fn();
    const {UNSAFE_getByType} = renderWithTheme(
      <CStandardHeader title="Header" onPressBack={onPressBack} />,
    );
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onPressBack).toHaveBeenCalled();
  });

  it('CTagText dispara iconRight', () => {
    const onPressRightIcon = jest.fn();
    const {UNSAFE_getByType} = renderWithTheme(
      <CTagText
        title="Titulo"
        subtitle="Sub"
        iconRight={<Text>R</Text>}
        onPressRightIcon={onPressRightIcon}
      />,
    );
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onPressRightIcon).toHaveBeenCalled();
  });

  it('CTransferRowCard dispara onPress', () => {
    const onPress = jest.fn();
    const {UNSAFE_getByType} = renderWithTheme(
      <CTransferRowCard leftTitle="L" rightTitle="R" onPress={onPress} />,
    );
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onPress).toHaveBeenCalled();
  });

  it('CUserCard renderiza data opcional', () => {
    const {getByText} = renderWithTheme(
      <CUserCard ionIcon="person" name="Nombre" data="Dato" />,
    );
    expect(getByText('Nombre')).toBeTruthy();
    expect(getByText('Dato')).toBeTruthy();
  });

  it('CLoaderOverlay muestra mensaje', () => {
    const {getByText} = renderWithTheme(<CLoaderOverlay message="Cargando" />);
    expect(getByText('Cargando')).toBeTruthy();
  });

  it('CBigAlert ejecuta onPress', () => {
    const onPress = jest.fn();
    const {getByTestId} = renderWithTheme(
      <CBigAlert testID="alert" title="Alerta" subttle="Sub" icon="alert" onPress={onPress} />,
    );
    fireEvent.press(getByTestId('alert'));
    expect(onPress).toHaveBeenCalled();
  });

  it('CEtiqueta renderiza texto', () => {
    const {getByText} = renderWithTheme(
      <CEtiqueta title="Titulo" text="Valor" icon={<Text>I</Text>} />,
    );
    expect(getByText('Titulo')).toBeTruthy();
    expect(getByText('Valor')).toBeTruthy();
  });

  it('CListCard renderiza item y dispara onPress', () => {
    const onPress = jest.fn();
    const item = {title: 'Item', value: 'Valor'};
    const {getByText} = renderWithTheme(
      <CListCard item={item} index={0} onPress={onPress} />,
    );
    fireEvent.press(getByText('Item'));
    expect(onPress).toHaveBeenCalled();
  });
});
