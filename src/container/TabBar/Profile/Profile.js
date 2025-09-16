import React, {useState} from 'react';
import {
  Image,
  ScrollView,
  SectionList,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import {THEME, getHeight, moderateScale} from '../../../common/constants';
import {styles} from '../../../themes';
import {useDispatch, useSelector} from 'react-redux';
import CHeader from '../../../components/common/CHeader';
import images from '../../../assets/images';
import CText from '../../../components/common/CText';
import {ProfileDataV2} from '../../../api/constant';
import {StackNav} from '../../../navigation/NavigationKey';
import {colors} from '../../../themes/colors';
import {changeThemeAction} from '../../../redux/action/themeAction';
import {setAsyncStorageData} from '../../../utils/AsyncStorage';
import LogOutModal from '../../../components/modal/LogOutModal';
import CHash from '../../../components/common/CHash';
import String from '../../../i18n/String';
import { getCredentialSubjectFromPayload } from '../../../utils/Cifrate';

export default function Profile({navigation}) {
  const color = useSelector(state => state.theme.theme);
  const [isEnabled, setIsEnabled] = useState(!!color.dark);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const dispatch = useDispatch();

  const userData = useSelector(state => state.wallet.payload);
  console.log(userData);

const subject = getCredentialSubjectFromPayload(userData) || {};
  const addr = userData?.account ?? '';
  const data = {
    name: subject?.fullName || '(sin nombre)',
    hash: addr ? `${addr.slice(0, 10)}…` : '(sin hash)',
  };

  // Datos de reputación y NFTs
  const reputation = {
    coincidencias: 17,
    confianza: 94,
  };

  const nfts = [
    {
      title: String.uploadActaNFT,
      desc: String.uploadActaNFTDesc,
      icon: <Entypo name="archive" size={30} color="#EA7C4B" />,
      bg: '#FDEAE5',
      border: '#F5C9BE',
    },
    {
      title: String.witnessNFT,
      desc: String.witnessNFTDesc,
      icon: <Feather name="award" size={30} color="#4075BA" />,
      bg: '#EEF6FE',
      border: '#B3D1F5',
    },
  ];

  // Sección adicional (ProfileDataV2)
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
        disabled={item === 'darkMode'}
        s
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
              <Entypo
                name={item.icon}
                size={moderateScale(20)}
                color={color.dark ? color.grayScale500 : color.grayScale400}
              />
            ) : (
              <View>{color.dark ? item.darkIcon : item.lightIcon}</View>
            )}
          </View>
          <View style={styles.ml10}>
            <CText type={'B16'}>{item.title}</CText>
            <CText type={'R12'} color={color.grayScale500}>
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
        {/* Header perfil */}
        <LinearGradient
          start={{x: 0, y: 0}}
          end={{x: 1, y: 2.1}}
          style={localStyle.activityHeader}
          colors={['#4A5568', '#2D3748', '#1A202C']}>
          <CHeader color={color.white} />
          <Image
            source={images.PersonCircleImage}
            style={localStyle.profileImage}
          />
          <View style={localStyle.userNameAndEmailContainer}>
            <CText type={'B20'} color={color.white} align={'center'}>
              {data.name}
            </CText>
            <CHash
              text={data.hash}
              title={userData?.account}
              textColor={'#fff'}
            />
          </View>
        </LinearGradient>

        {/* Resumen de reputación 
        <View style={localStyle.boxSection}>
          <CText type="B14" style={localStyle.sectionTitle}>
            {String.reputationSummary}
          </CText>
          <TouchableOpacity 
            style={localStyle.reputationBox}
            onPress={() => navigation.navigate(StackNav.OracleParticipation)}
          >
            <View style={localStyle.reputationIcon}>
              <Feather name="eye" size={28} color="#5B4D9A" />
            </View>
            <View style={{ flex: 1 }}>
              <CText type="B16" style={{ marginBottom: 2 }}>
                {String.oracleParticipation}
              </CText>
              <CText type="R13" color="#636363">
                <Feather name="heart" size={13} color="#E2435A" />{' '}
                {reputation.coincidencias} {String.coincidences} – {String.trust} {reputation.confianza}%
              </CText>
            </View>
          </TouchableOpacity>
        </View>
        */}

        {/* NFTs obtenidos 
        <View style={localStyle.boxSection}>
          <CText type="B14" style={localStyle.sectionTitle}>
            {String.nftsObtained}
          </CText>
          <View>
            {nfts.map((nft, i) => (
              <View
                key={nft.title}
                style={[
                  localStyle.nftBox,
                  {
                    backgroundColor: nft.bg,
                    borderColor: nft.border,
                  },
                ]}
              >
                <View style={localStyle.nftIconBox}>
                  {nft.icon}
                </View>
                <View style={{ flex: 1 }}>
                  <CText type="B15" style={{ marginBottom: 1 }}>
                    {nft.title}
                  </CText>
                  <CText type="R12" color="#636363">
                    {nft.desc}
                  </CText>
                </View>
              </View>
            ))}
          </View>
        </View>
        */}
        {/* Sección de datos adicionales */}
        <View style={localStyle.mainContainer}>
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

        {/* Botón de seleccionar insignia 
        <View style={{ marginVertical: 20, alignItems: 'center' }}>
          <TouchableOpacity style={localStyle.mainBtn}>
            <CText type="B16" color="#222">
              {String.selectFeaturedBadge}
            </CText>
          </TouchableOpacity>
        </View>
        */}

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
    height: getHeight(330),
    ...styles.mt1,
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
  boxSection: {
    paddingHorizontal: 20,
    marginTop: 18,
  },
  sectionTitle: {
    marginBottom: 4,
    color: '#222',
  },
  reputationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F4FD',
    borderRadius: 13,
    padding: 14,
    marginBottom: 4,
  },
  reputationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E4D6FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  nftBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 13,
    marginBottom: 8,
    borderWidth: 1,
  },
  nftIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  mainBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#222',
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
