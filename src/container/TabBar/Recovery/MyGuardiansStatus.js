import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useMemo, useRef, useState} from 'react';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import {styles} from '../../../themes';
import {
  getHeight,
  GUARDIAN_RECOVERY_DNI,
  moderateScale,
  PENDING_OWNER_ACCOUNT,
  PENDING_OWNER_GUARDIAN_CT,
  PENDINGRECOVERY,
} from '../../../common/constants';
import CText from '../../../components/common/CText';
import Icono from '../../../components/common/Icono';

import String from '../../../i18n/String';
import {FlatList} from 'react-native-gesture-handler';
import {useSelector} from 'react-redux';
import {AuthNav, StackNav} from '../../../navigation/NavigationKey';

import {useGuardiansRecoveryDetailQuery} from '../../../data/guardians';
import {ActivityIndicator} from 'react-native-paper';
import {getDeviceId} from '../../../utils/device-id';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CButton from '../../../components/common/CButton';
import {CHAIN} from '@env';
import {readOnChainApprovals} from '../../../api/guardianOnChain';
import wira from 'wira-sdk';
import LoadingModal from '../../../components/modal/LoadingModal';



const statusColorKey = {
  ACCEPTED: 'activeColor',
  PENDING: 'pendingColor',
  REJECTED: 'rejectedColor',
  REMOVED: 'rejectedColor',
};

export default function MyGuardiansStatus({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const deviceId = useRef();

  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState({
    visible: false,
    message: '',
    isLoading: false,
  });

  // Mantén tu firma original del hook; el segundo arg puede ser "enabled/ready" según tu implementación
  const {
    data: detailRaw,
    isLoading,
    remove,
  } = useGuardiansRecoveryDetailQuery(deviceId.current, ready);

  // Normaliza para que siempre existan arrays y evita "map of undefined"
  const safeDetail = useMemo(() => {
    const d = detailRaw ?? {};
    return {
      ...d,
      approved: Array.isArray(d?.votes) ? d.votes : [],
      rejected: Array.isArray(d?.votes) ? d.votes : [],
    };
  }, [detailRaw]);

  const guardians = useMemo(() => {
    return safeDetail?.votes ?? [];
  }, [safeDetail]);
 

  const statusLabel = {
    ACCEPTED: String.active,
    PENDING: String.pending,
    REJECTED: String.rejected,
    REMOVED: String.removed ?? 'Removido',
  };

  useEffect(() => {
    if (!safeDetail?.ok) return;

    const initRecovery = async () => {
      const recoveryDni = await AsyncStorage.getItem(GUARDIAN_RECOVERY_DNI);
      if(recoveryDni && recoveryDni.length > 0) {
        return (new wira.RecoveryService()).recoveryFromGuardians(recoveryDni);
      }

      setModal({
        visible: true,
        message: String.noRecoveryDni,
        isLoading: false,
      });
      throw new Error('No recovery DNI found');
    }

    if (safeDetail.status === 'APPROVED') {
      setModal({
        visible: true,
        message: String.guardiansApprovedMessage,
        isLoading: true,
      });

      initRecovery()
      .then((recData) => {
        setModal({
          visible: false,
          title: '',
          message: '',
          isLoading: false,
        })
        navigation.replace(AuthNav.RecoveryUser1Pin, {recData});
      }).catch(e => {
        console.log('Recovery init error:', e);
      });
    } else if (safeDetail.status === 'REJECTED') {
      remove();
      AsyncStorage.setItem(PENDINGRECOVERY, 'false');
      navigation.replace(AuthNav.SelectRecuperation);
    }
  }, [safeDetail, navigation, remove]);

  useEffect(() => {
    getDeviceId().then(id => {
      deviceId.current = id;
      setReady(true);
    });
  }, []);

  if (isLoading || !ready) {
    return (
      <View style={localStyle.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primaryColor} />
      </View>
    );
  }

  const onPressReturn = () => {
    navigation.navigate(StackNav.AuthNavigation, {
      screen: AuthNav.Connect,
    });
  };

  const renderGuardianOption = ({item}) => {
    const colorKey = statusColorKey[item.status] || 'pendingColor';
    let actionIcon = null;
    if (item.status === 'PENDING') {
      actionIcon = <ActivityIndicator size="small" color={colors[colorKey]} />;
    } else if (item.status === 'ACCEPTED') {
      actionIcon = (
        <Icono
          name="check-all"
          size={moderateScale(24)}
          color={colors[colorKey]}
        />
      );
    } else if (item.status === 'REJECTED') {
      actionIcon = (
        <Icono
          name="window-close"
          size={moderateScale(24)}
          color={colors[colorKey]}
        />
      );
    }

    return (
      <TouchableOpacity
        style={[
          localStyle.optionContainer,
          {
            backgroundColor: colors.backgroundColor,
            borderColor: colors.dark ? colors.grayScale700 : colors.grayScale200,
            elevation: 5,
          },
        ]}>
        <View style={styles.rowCenter}>
          <View
            style={[
              localStyle.iconBg,
              {
                borderColor: colors.dark
                  ? colors.stepBackgroundColor
                  : colors.grayScale200,
              },
            ]}>
            <Icono name="account" size={moderateScale(24)} />
          </View>
          <View style={styles.ml10}>
            <View style={styles.rowCenter}>
              <CText type="B16"> {item.nickname ?? '(sin apodo)'}</CText>

              <View
                style={[localStyle.badge, {backgroundColor: colors[colorKey]}]}>
                <CText type="R12" color={colors.white}>
                  {statusLabel[item.status]}
                </CText>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.ml10}>{actionIcon}</View>
      </TouchableOpacity>
    );
  };

  return (
    <CSafeAreaView>
      <CHeader title={String.guardiansTitleStatus} />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.ph20}>
        <CText type={'B16'} align={'center'} marginTop={15}>
          {String.guardiansDescriptionStatus}
        </CText>
        <View>
          { guardians.length > 0 ?
            <FlatList
              data={guardians}
              keyExtractor={(g, i) => g.guardianDid || i}
              renderItem={renderGuardianOption}
              contentContainerStyle={styles.mt20}
            />
            : <CText align={'center'} marginTop={15}>{String.noGuardians}</CText>
          }
        </View>
      </KeyBoardAvoidWrapper>
      <View style={localStyle.bottomTextContainer}>
        <CButton
          title={String.return}
          onPress={onPressReturn}
          type={'B16'}
          containerStyle={localStyle.btnStyle}
        />
      </View>
      <LoadingModal
        {...modal}
        buttonText={String.retryRecovery}
        onClose={() => navigation.replace(AuthNav.SelectRecuperation)}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
    marginTop: 50,
    gap: 5,
    marginBottom: 10,
    justifyContent: 'center',
    width: '100%',
    height: getHeight(300),
    alignItems: 'center',
  },
  inputBoxStyle: {
    width: '80%',
  },
  countryPickerButton: {
    ...styles.ml5,
  },
  mobileNumberContainer: {
    ...styles.flexRow,
  },
  countryPickerStyle: {
    ...styles.rowSpaceBetween,
    borderRadius: moderateScale(12),
    height: getHeight(52),
    ...styles.mt15,
    width: moderateScale(89),
  },
  userImage: {
    width: moderateScale(100),
    height: moderateScale(100),
    ...styles.selfCenter,
    ...styles.mt40,
  },
  labelText: {
    textAlign: 'left',
    opacity: 0.9,
    ...styles.mt15,
  },
  editProfileIconStyle: {
    height: moderateScale(24),
    width: moderateScale(24),
    position: 'absolute',
    borderWidth: moderateScale(3),
    borderRadius: moderateScale(12),
    left: moderateScale(75),
    top: moderateScale(75),
    ...styles.center,
  },
  changesBtn: {
    ...styles.selfCenter,
    width: '90%',
  },
  imageContainer: {
    ...styles.selfCenter,
    height: moderateScale(300),
    width: moderateScale(300),
  },
  bottomTextContainer: {
    ...styles.ph20,
    gap: 5,
  },
  btnStyle: {
    marginBottom: moderateScale(1),
    borderWidth: moderateScale(1),
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(12),
    marginVertical: moderateScale(6),
  },
  iconBg: {
    height: moderateScale(40),
    width: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: moderateScale(3),
  },
  badge: {
    marginLeft: moderateScale(8),
    paddingHorizontal: moderateScale(6),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    width: '100%',
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginTop: moderateScale(20),
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconContainer: {
    marginBottom: moderateScale(12),
  },
  infoTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: moderateScale(18),
    fontWeight: '800',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(10),
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
