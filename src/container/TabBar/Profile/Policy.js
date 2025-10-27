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
import {useNavigationLogger} from '../../../hooks/useNavigationLogger';

export default function Policy({navigation}) {
  // Hook para logging de navegación
  const { logAction, logNavigation } = useNavigationLogger('Policy', true);
  const onPressCode = () => {
    navigation.navigate(StackNav.RewardCode);
  };

  const onPress = () => {
    navigation.navigate(StackNav.RewardHistory);
  };

  return (
    <CSafeAreaView>
      <CHeader title={String.rewardsProgram} testID="policyHeader" />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.ph20}>
        <Image source={images.RewardImage} style={localStyle.imageContainer} />
        <CText
          type="B16"
          align="center"
          marginTop={20}
          color={getSecondaryTextColor(colors)}>
          {String.inviteRewardMessage}
        </CText>
      </KeyBoardAvoidWrapper>
      <View style={localStyle.bottomTextContainer}>
        <CAlert status="info" message={String.alertRewardMessage} />
        <CButton
          title={String.generateInviteCode}
          onPress={onPressCode}
          type="B16"
          containerStyle={localStyle.btnStyle}
          sinMargen
        />
        <CButton
          variant="outlined"
          title={String.viewMyRewards}
          onPress={onPress}
          type="B16"
          containerStyle={localStyle.btnStyle}
        />
      </View>
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
