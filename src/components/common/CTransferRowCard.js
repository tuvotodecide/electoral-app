import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import {useSelector} from 'react-redux';
import {getSecondaryTextColor} from '../../utils/ThemeUtils';
import CDivider from './CDivider';
import Icono from './Icono';

const CTransferRowCard = ({
  leftTitle = '',
  leftSubtitle = '',
  rightTitle = '',
  rightSubtitle = '',
  isSent = true,
  onPress,
}) => {
  const colors = useSelector(state => state.theme.theme);
  const isDark = useColorScheme() === 'dark';

  const arrowColor = isSent
    ? isDark
      ? '#FFB74D'
      : '#F57C00'
    : isDark
    ? '#81C784'
    : '#388E3C';

  const arrowIcon = isSent ? 'arrow-top-right' : 'arrow-bottom-left';

  return (
    <TouchableOpacity
      style={[styles.card]}
      onPress={onPress}
      activeOpacity={0.8}>
      <View style={styles.row}>
        <View
          style={{
            borderRadius: 50,
            borderWidth: 1,
            borderColor: arrowColor,
            padding: 6,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icono name={arrowIcon} size={24} color={arrowColor} />
        </View>
        <View style={styles.textSection}>
          <View>
            <Text style={[styles.title, {color: colors.textColor}]}>
              {leftTitle}
            </Text>
            <Text
              style={[styles.subtitle, {color: getSecondaryTextColor(colors)}]}>
              {leftSubtitle}
            </Text>
          </View>

          <View style={{alignItems: 'flex-end'}}>
            <Text style={[styles.title, {color: colors.textColor}]}>
              {rightTitle}
            </Text>
            <Text
              style={[styles.subtitle, {color: getSecondaryTextColor(colors)}]}>
              {rightSubtitle}
            </Text>
          </View>
        </View>
      </View>
      <CDivider />
    </TouchableOpacity>
  );
};

export default CTransferRowCard;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 10,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  card: {
    marginBottom: 8,
  },
});
