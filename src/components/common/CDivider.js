import React from 'react';
import {StyleSheet} from 'react-native';
import {Divider} from 'react-native-paper';
import {useSelector} from 'react-redux';
import {getSecondaryTextColor} from '../../utils/ThemeUtils';

const CDivider = ({color, marginTop, style}) => {
  const colors = useSelector(state => state.theme.theme);
  const backgroundColor = color || getSecondaryTextColor(colors);

  return (
    <Divider
      style={[
        styles.divider,
        {
          backgroundColor,
          marginTop:
            marginTop !== undefined ? marginTop : styles.divider.marginTop,
        },
        style
      ]}
    />
  );
};

export default CDivider;

const styles = StyleSheet.create({
  divider: {
    marginTop: 10,
  },
});
