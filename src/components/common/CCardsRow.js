import React from 'react';
import {View, StyleSheet} from 'react-native';

const CCardsRow = ({children}) => {
  return <View style={styles.container}>{children}</View>;
};

export default CCardsRow;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    gap: 10,
  },
});
