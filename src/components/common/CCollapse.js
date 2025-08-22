import React, {useState} from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {getSecondaryTextColor} from '../../utils/ThemeUtils';
import {useSelector} from 'react-redux';
import Icono from './Icono';
import CText from './CText';

const CCollapse = ({
  leftIconName = 'chevron-down',
  rightIconName = 'magnify',
  title = '',
  onRightIconPress = () => {},
  children,
}) => {
  const colors = useSelector(state => state.theme.theme);
  const [collapsed, setCollapsed] = useState(true);

  const toggleCollapse = () => setCollapsed(!collapsed);

  return (
    <View>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={toggleCollapse}
          style={styles.leftIconWrapper}>
          <Icono
            name={leftIconName}
            size={24}
            color={getSecondaryTextColor(colors)}
            style={{transform: [{rotate: collapsed ? '0deg' : '180deg'}]}}
          />
        </TouchableOpacity>

        <CText
          type="B16"
          style={[styles.titleText, {color: getSecondaryTextColor(colors)}]}>
          {title}
        </CText>

        <TouchableOpacity
          onPress={onRightIconPress}
          style={styles.rightIconWrapper}>
          <Icono
            name={rightIconName}
            size={24}
            color={getSecondaryTextColor(colors)}
          />
        </TouchableOpacity>
      </View>

      {!collapsed && (
        <View
          style={[
            styles.collapseContent,
            {backgroundColor: colors.background},
          ]}>
          {children}
        </View>
      )}
    </View>
  );
};

export default CCollapse;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  leftIconWrapper: {
    padding: 0,
  },
  rightIconWrapper: {
    padding: 0,
  },
  titleText: {
    flex: 1,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  collapseContent: {
    paddingHorizontal: 5,
    paddingVertical: 0,
  },
});
