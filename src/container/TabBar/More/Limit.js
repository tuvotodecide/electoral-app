import {Image, StyleSheet, View} from 'react-native';
import React from 'react';

// custom imports
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import {styles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import CText from '../../../components/common/CText';
import CAlert from '../../../components/common/CAlert';
import CButton from '../../../components/common/CButton';
import {colors} from '../../../themes/colors';
import images from '../../../assets/images';
import {getSecondaryTextColor} from '../../../utils/ThemeUtils';
import {StackNav} from '../../../navigation/NavigationKey';
import String from '../../../i18n/String';

export default function Limit({navigation}) {
  const onPressCode = () => {
    navigation.navigate(StackNav.RewardCode);
  };

  const onPress = () => {
    navigation.navigate(StackNav.RewardHistory);
  };

  return (
    <CSafeAreaView>
      <CHeader title={String.limitTitle} />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.ph20}>
        <CText type="B16" marginTop={20} color={getSecondaryTextColor(colors)}>
          {String.limitSubtitle}
        </CText>
      </KeyBoardAvoidWrapper>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  imageContainer: {
    ...styles.selfCenter,
    height: moderateScale(200),
    width: moderateScale(200),
  },
  bottomTextContainer: {
    ...styles.ph20,
    gap: 5,
  },
  btnStyle: {
    marginTop: 8,
  },
});
