import {Image, StyleSheet, View} from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import {getHeight, moderateScale} from '../../../common/constants';
import {styles} from '../../../themes';
import {useSelector} from 'react-redux';
import CText from '../../../components/common/CText';
import images from '../../../assets/images';

export default function AboutApp() {
  const colors = useSelector(state => state.theme.theme);

  return (
    <CSafeAreaView>
      <LinearGradient
        start={{x: 0, y: 0}}
        end={{x: 1, y: 2.1}}
        style={localStyle.activityHeader}
        colors={[colors.gradient1, colors.gradient2, colors.gradient1]}>
        <CHeader color={colors.white} />
        <View style={localStyle.headerContainer}>
          <CText type={'B24'} color={colors.white}>
            {String.allInOneInvestmentPlatform}
          </CText>
          <CText
            type={'R14'}
            color={colors.primary2}
            style={localStyle.appText}>
            {String.aboutAppText}
          </CText>
        </View>
      </LinearGradient>
      <View style={localStyle.headerContainer}>
        <CText type={'B18'} style={localStyle.aboutUsText}>
          {String.aboutUs}
        </CText>
        <CText
          type={'R14'}
          color={colors.grayScale500}
          style={localStyle.appText}>
          {String.aboutUsText1}
        </CText>
        <CText
          type={'R14'}
          color={colors.grayScale500}
          style={localStyle.appText}>
          {String.aboutUsText2}
        </CText>
        <View
          style={[
            localStyle.bottomViewContainer,
            {
              backgroundColor: colors.inputBackground,
            },
          ]}>
          <Image
            source={images.AboutAppImage}
            style={localStyle.aboutAppImage}
          />
          <View style={localStyle.joinTeamContainer}>
            <CText type={'B14'}>{String.joinOurTeam}</CText>
            <CText type={'R10'} color={colors.grayScale500} numberOfLines={3}>
              {String.joinTeamText}
            </CText>
          </View>
        </View>
      </View>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  activityHeader: {
    height: getHeight(250),
  },
  headerContainer: {
    ...styles.ph20,
  },
  appText: {
    ...styles.mt5,
    lineHeight: moderateScale(20),
  },
  aboutUsText: {
    ...styles.mt20,
  },
  bottomViewContainer: {
    ...styles.p20,
    borderRadius: moderateScale(12),
    ...styles.mt20,
    width: 'auto',
    ...styles.rowSpaceBetween,
  },
  aboutAppImage: {
    width: moderateScale(70),
    height: moderateScale(65),
  },
  joinTeamContainer: {
    ...styles.ml20,
    width: '60%',
  },
});
