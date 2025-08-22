import {StyleSheet, ActivityIndicator, View, Modal} from 'react-native';
import React from 'react';
import {useIsFocused} from '@react-navigation/native';
import {styles} from '../../themes';
import {colors} from '../../themes/colors';

const CLoader = () => {
  const isFocused = useIsFocused();

  if (!isFocused) {
    return <View />;
  }

  return (
    <Modal transparent>
      <View style={localStyles.vwMainStyle}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  vwMainStyle: {
    ...styles.flex,
    ...styles.center,
    backgroundColor: colors.transparent,
  },
});

export default React.memo(CLoader);
