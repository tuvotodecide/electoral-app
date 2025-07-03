import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

import CText from './CText';
import {moderateScale} from '../../common/constants';

const CStandardHeader = ({
  title,
  onPressBack,
  rightIcon,
  titleStyle,
  containerStyle,
  backButtonStyle,
  hideBackButton = false,
}) => {
  const navigation = useNavigation();
  const colors = useSelector(state => state.theme.theme);

  const handleBack = () => {
    if (onPressBack) {
      onPressBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[localStyles.header, containerStyle]}>
      {!hideBackButton && (
        <TouchableOpacity
          onPress={handleBack}
          style={[localStyles.backButton, backButtonStyle]}>
          <Ionicons
            name="arrow-back"
            size={moderateScale(24)}
            color={colors.textColor}
          />
        </TouchableOpacity>
      )}

      <CText
        style={[localStyles.headerTitle, titleStyle]}
        color={colors.textColor}>
        {title}
      </CText>

      {rightIcon ? rightIcon : <View style={{width: moderateScale(24)}} />}
    </View>
  );
};

export default CStandardHeader;

const localStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 24,
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
