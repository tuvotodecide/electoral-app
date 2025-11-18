import {
  ScrollView,
  SectionList,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icons from 'react-native-vector-icons/Entypo';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import {THEME, getHeight, moderateScale} from '../../../common/constants';
import {styles} from '../../../themes';
import {useDispatch, useSelector} from 'react-redux';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import {ProfileDataV3} from '../../../api/constant';
import {StackNav} from '../../../navigation/NavigationKey';
import {colors} from '../../../themes/colors';
import {changeThemeAction} from '../../../redux/action/themeAction';
import {setAsyncStorageData} from '../../../utils/AsyncStorage';
import LogOutModal from '../../../components/modal/LogOutModal';
import {logOut} from '../../../utils/auth';


export default function More({navigation}) {
  const color = useSelector(state => state.theme.theme);
  const [isEnabled, setIsEnabled] = useState(!!color.dark);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const dispatch = useDispatch();
  const onPressItem = item => {
    if (!!item.route) {
      navigation.navigate(item.route, {item: item});
    } else if (!!item.logOut) {
      setIsModalVisible(!isModalVisible);
    }
  };
  const RenderSectionHeader = ({section: {section}}) => {
    return (
      <CText testID={`moreSectionHeader_${section.replace(/\s+/g, '')}`} type={'B16'} style={styles.mv10}>
        {section}
      </CText>
    );
  };
  const onPressReferralCode = () => {
    navigation.navigate(StackNav.ReferralCode);
  };

  const onPressLightTheme = () => {
    setAsyncStorageData(THEME, 'light');
    dispatch(changeThemeAction(colors.light));
  };

  const onPressDarkTheme = () => {
    setAsyncStorageData(THEME, 'dark');
    dispatch(changeThemeAction(colors.dark));
  };
  const toggleSwitch = val => {
    if (val) {
      onPressDarkTheme();
    } else {
      onPressLightTheme();
    }
    setIsEnabled(previousState => !previousState);
  };
  const onPressCancelBtn = () => {
    setIsModalVisible(false);
  };
  const onPressLOut = async () => {
    setIsModalVisible(false);
 

    setTimeout(() => logOut(navigation), 200);
  };

  const RenderItem = ({item, index}) => {
    return (
      <TouchableOpacity
        testID={`moreMenuItem_${item.id || index}`}
        disabled={item === String.darkMode}
        key={index}
        activeOpacity={item.rightIcon ? 1 : 0.5}
        onPress={() => onPressItem(item)}
        style={[
          localStyle.renderItemContainer,
          {
            borderColor: color.dark ? color.grayScale700 : color.grayScale200,
          },
        ]}>
        <View testID={`moreMenuItemContent_${item.id || index}`} style={styles.rowCenter}>
          <View
            testID={`moreMenuItemIcon_${item.id || index}`}
            style={[
              localStyle.iconBackground,
              {
                backgroundColor:
                  item?.id === 5 || item?.id === 6
                    ? color.primary
                    : color.inputBackground,
              },
            ]}>
            {item.icon ? (
              <Icons
                testID={`moreMenuItemIconSvg_${item.id || index}`}
                name={item.icon}
                size={moderateScale(20)}
                color={color.dark ? color.grayScale500 : color.grayScale400}
              />
            ) : (
              <View testID={`moreMenuItemCustomIcon_${item.id || index}`}>{color.dark ? item.darkIcon : item.lightIcon}</View>
            )}
          </View>
          <View testID={`moreMenuItemText_${item.id || index}`} style={styles.ml10}>
            <CText testID={`moreMenuItemTitle_${item.id || index}`} type={'B12'}>{item.title}</CText>
            <CText testID={`moreMenuItemValue_${item.id || index}`} type={'R10'} color={color.grayScale500}>
              {item.value}
            </CText>
          </View>
        </View>
        {!!item.rightIcon ? (
          <Switch
            testID={`moreMenuItemSwitch_${item.id || index}`}
            trackColor={{
              false: color.dark ? color.grayScale700 : color.grayScale200,
              true: color.primary,
            }}
            thumbColor={color.white}
            onValueChange={toggleSwitch}
            value={isEnabled}
          />
        ) : (
          <Ionicons
            testID={`moreMenuItemArrow_${item.id || index}`}
            name={'chevron-forward-outline'}
            size={moderateScale(24)}
            color={color.dark ? color.grayScale500 : color.grayScale400}
            style={styles.mr10}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <CSafeAreaView testID="moreContainer">
      <ScrollView testID="moreScrollView" showsVerticalScrollIndicator={false} bounces={false}>
        <View testID="moreMainContainer" style={localStyle.mainContainer}>
          <SectionList
            testID="moreMenuList"
            sections={ProfileDataV3}
            keyExtractor={(item, index) => item + index}
            renderItem={RenderItem}
            renderSectionHeader={RenderSectionHeader}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>
        <LogOutModal
          testID="moreLogoutModal"
          visible={isModalVisible}
          onPressCancel={onPressCancelBtn}
          onPressLogOut={onPressLOut}
        />
      </ScrollView>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
  },
  activityHeader: {
    height: getHeight(285),
    ...styles.mt10,
  },
  profileImage: {
    ...styles.selfCenter,
    height: moderateScale(88),
    width: moderateScale(88),
    ...styles.mt30,
  },
  userNameAndEmailContainer: {
    ...styles.mt20,
  },
  invitationContainer: {
    height: moderateScale(88),
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(12),
    ...styles.rowSpaceBetween,
    ...styles.mt20,
  },
  invitationText: {
    width: '55%',
    ...styles.ml20,
    lineHeight: moderateScale(25),
  },
  giftImage: {
    height: moderateScale(87),
    width: moderateScale(104),
    borderBottomRightRadius: moderateScale(12),
  },
  renderItemContainer: {
    height: moderateScale(72),
    borderRadius: moderateScale(12),
    ...styles.rowSpaceBetween,
    ...styles.mv10,
    ...styles.ph10,
    borderWidth: moderateScale(1),
  },
  iconBackground: {
    height: moderateScale(40),
    width: moderateScale(40),
    borderRadius: moderateScale(20),
    ...styles.center,
  },
});
