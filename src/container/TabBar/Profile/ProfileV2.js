import {
  Image,
  ScrollView,
  SectionList,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icons from 'react-native-vector-icons/Entypo';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import {THEME, getHeight, moderateScale} from '../../../common/constants';
import {styles} from '../../../themes';
import {useDispatch, useSelector} from 'react-redux';
import CHeader from '../../../components/common/CHeader';
import {EditIcon} from '../../../assets/svg';
import images from '../../../assets/images';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import {ProfileData, ProfileDataV2} from '../../../api/constant';
import {StackNav} from '../../../navigation/NavigationKey';
import {colors} from '../../../themes/colors';
import {changeThemeAction} from '../../../redux/action/themeAction';
import {setAsyncStorageData} from '../../../utils/AsyncStorage';
import LogOutModal from '../../../components/modal/LogOutModal';

export default function Profile({navigation}) {
  const color = useSelector(state => state.theme.theme);
  const [isEnabled, setIsEnabled] = useState(!!color.dark);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const dispatch = useDispatch();

  const RightAccessory = () => {
    return (
      <TouchableOpacity style={styles.mr10}>
        <EditIcon />
      </TouchableOpacity>
    );
  };
  const onPressItem = item => {
    if (!!item.route) {
      navigation.navigate(item.route, {item: item});
    } else if (!!item.logOut) {
      setIsModalVisible(!isModalVisible);
    }
  };
  const RenderSectionHeader = ({section: {section}}) => {
    return (
      <CText type={'B16'} style={styles.mv10}>
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
    try {
      setIsModalVisible(false);
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{name: StackNav.AuthNavigation}],
        });
      }, 500);
      return true;
    } catch (exception) {
      return false;
    }
  };

  const RenderItem = ({item, index}) => {
    return (
      <TouchableOpacity
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
        <View style={styles.rowCenter}>
          <View
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
                name={item.icon}
                size={moderateScale(20)}
                color={color.dark ? color.grayScale500 : color.grayScale400}
              />
            ) : (
              <View>{color.dark ? item.darkIcon : item.lightIcon}</View>
            )}
          </View>
          <View style={styles.ml10}>
            <CText type={'B12'}>{item.title}</CText>
            <CText type={'R10'} color={color.grayScale500}>
              {item.value}
            </CText>
          </View>
        </View>
        {!!item.rightIcon ? (
          <Switch
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
    <CSafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <LinearGradient
          start={{x: 0, y: 0}}
          end={{x: 1, y: 2.1}}
          style={localStyle.activityHeader}
          colors={[color.gradient1, color.gradient2, color.gradient1]}>
          <CHeader rightIcon={<RightAccessory />} color={color.white} />
          <Image source={images.ProfileImage} style={localStyle.profileImage} />
          <View style={localStyle.userNameAndEmailContainer}>
            <CText type={'B20'} color={color.white} align={'center'}>
              {String.helenaSarapova}
            </CText>
            <CText type={'R14'} color={color.primary2} align={'center'}>
              {String.userEmail}
            </CText>
          </View>
        </LinearGradient>
        <View style={localStyle.mainContainer}>
          <TouchableOpacity
            onPress={onPressReferralCode}
            style={[
              localStyle.invitationContainer,
              {
                borderColor: color.primary2,
              },
            ]}>
            <CText
              type={'R14'}
              numberOfLines={2}
              style={localStyle.invitationText}>
              {String.invitationText}
            </CText>
            <Image
              source={images.GiftInvitationImage}
              style={localStyle.giftImage}
            />
          </TouchableOpacity>

          <SectionList
            sections={ProfileDataV2}
            keyExtractor={(item, index) => item + index}
            renderItem={RenderItem}
            renderSectionHeader={RenderSectionHeader}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>
        <LogOutModal
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
