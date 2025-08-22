import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import {getSecondaryTextColor} from '../../utils/ThemeUtils';

const CCardRed = ({
  imageSource,
  title = '',
  subtitle = '',
  leftAmount = '',
  rightText = '',
}) => {
  const colors = useSelector(state => state.theme.theme);

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: getSecondaryTextColor(colors),
        },
      ]}>
      <View style={styles.topRow}>
        <Image source={imageSource} style={styles.image} />
        <View style={styles.textsContainer}>
          <Text style={[styles.title, {color: colors.textColor}]}>{title}</Text>
          <Text
            style={[styles.subtitle, {color: getSecondaryTextColor(colors)}]}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Text style={[styles.leftAmount, {color: colors.textColor}]}>
          {leftAmount}
        </Text>
        <Text style={[styles.rightText, {color: colors.success}]}>
          {rightText}
        </Text>
      </View>
    </View>
  );
};

export default CCardRed;

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 8,
    backgroundColor: 'transparent',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textsContainer: {
    marginLeft: 5,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  image: {
    width: 50,
    height: 50,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  leftAmount: {
    fontSize: 16,
  },
  rightText: {
    fontSize: 16,
  },
});
