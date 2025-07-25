import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useMemo, useState} from 'react';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import {styles} from '../../../themes';
import {getHeight, moderateScale} from '../../../common/constants';
import CText from '../../../components/common/CText';
import CButton from '../../../components/common/CButton';
import Icono from '../../../components/common/Icono';
import {PermissionsAndroid, Platform, ToastAndroid, Alert} from 'react-native';
import String from '../../../i18n/String';
import {FlatList} from 'react-native-gesture-handler';
import {useSelector} from 'react-redux';
import GuardianActionModal from '../../../components/modal/GuardianActionModal';
import {StackNav} from '../../../navigation/NavigationKey';
import {Short_Black, Short_White} from '../../../assets/svg';
import {
  useGuardianDeleteQuery,
  useGuardianPatchQuery,
  useMyGuardiansAllListQuery,
} from '../../../data/guardians';
import CAlert from '../../../components/common/CAlert';
import {ActivityIndicator} from 'react-native-paper';
import GuardianOptionsModal from '../../../components/modal/GuardianOptionsModal';

const statusColorKey = {
  ACCEPTED: 'activeColor',
  PENDING: 'pendingColor',
  REJECTED: 'rejectedColor',
  REMOVED: 'rejectedColor',
};

const baseColors = {
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800',
  info: '#2196f3',
};

export default function Guardians({navigation}) {
  const status = 'info';
  const colors = useSelector(state => state.theme.theme);
  const theme = useSelector(state => state.theme.theme);
  const isDark = theme.dark;
  const [modalVisible, setModalVisible] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState(null);

  const {data = [], error, isLoading} = useMyGuardiansAllListQuery();
  const {mutate: deleteGuardianId, isLoading: loading} =
    useGuardianDeleteQuery();
  const {mutate: patchGuardianId, isLoading: loadingpatch} =
    useGuardianPatchQuery();

  console.log(selectedGuardian);

  const guardians = useMemo(() => data.map(edge => edge.node), [data]);
  const visibleGuardians = useMemo(
    () =>
      guardians.filter(g => g.status === 'ACCEPTED' || g.status === 'PENDING'),
    [guardians],
  );
  const mainColor = baseColors[status] || baseColors.info;

  const statusLabel = {
    ACCEPTED: String.active,
    PENDING: String.pending,
    REJECTED: String.rejected,
    REMOVED: String.removed ?? 'Removido',
  };

  const onPressAddGuardian = () => {
    navigation.navigate(StackNav.AddGuardians);
  };
  const onPressMyProtected = () => {
    navigation.navigate(StackNav.GuardiansAdmin);
  };
  const onPressWatchInfoGuardian = () => {
    navigation.navigate(StackNav.OnBoardingGuardians);
  };

  const openModal = item => {
    setSelectedGuardian(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedGuardian(null);
  };

  const deleteGuardian = () => {
    deleteGuardianId(selectedGuardian.id, {
      onSuccess: () => {
        closeModal();
      },
    });
  };
  const saveGuardian = newNick => {
    patchGuardianId(
      {id: selectedGuardian.id, nickname: newNick},
      {
        onSuccess: () => {
          closeModal();
        },
      },
    );
  };
  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primaryColor} />
      </View>
    );
  }

  const RightIcon = () => (
    <View style={localStyle.rightIcons}>
      <TouchableOpacity onPress={onPressWatchInfoGuardian}>
        {guardians.length != 0 && (
          <Icono
            name="message-question"
            size={moderateScale(28)}
            color={colors.primaryColor}
          />
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setOptionsVisible(true)}>
        <Icono
          name="format-list-bulleted"
          size={moderateScale(28)}
          color={colors.primaryColor}
          style={styles.ml10}
        />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={localStyle.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primaryColor} />
      </View>
    );
  }

  const renderGuardianOption = ({item}) => {
    const parts = (item.fullName || '').split(' ');
    const firstSegment = parts[0] || '';
    const secondSegment = parts[1] || '';

    const abbreviated = secondSegment.slice(0, 2).toUpperCase();
    const displayName = secondSegment
      ? `${firstSegment} ${abbreviated}`
      : firstSegment;

    const colorKey = statusColorKey[item.status] || 'pendingColor';
    return (
      <TouchableOpacity
        style={[
          localStyle.optionContainer,
          {
            backgroundColor: colors.backgroundColor,
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,

            elevation: 5,
          },
        ]}
        onPress={() => console.log('Pulsaste', item.title)}>
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
              <CText type="B16">{displayName}</CText>

              <View
                style={[localStyle.badge, {backgroundColor: colors[colorKey]}]}>
                <CText type="R12" color={colors.white}>
                  {statusLabel[item.status]}
                </CText>
              </View>
            </View>
            <CText type="R12" color={colors.grayScale500}>
              {item.nickname ?? '(sin apodo)'}
            </CText>
          </View>
        </View>
        <TouchableOpacity onPress={() => openModal(item)}>
          <Icono
            name="dots-vertical"
            size={moderateScale(30)}
            style={styles.mr10}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const InfoCard = () => (
    <TouchableOpacity
      style={[
        localStyle.infoCard,
        {
          backgroundColor: colors.stepBackgroundColor,
          borderColor: colors.dark ? colors.grayScale700 : colors.grayScale200,
        },
      ]}
      activeOpacity={0.7}
      onPress={onPressWatchInfoGuardian}>
      <View style={localStyle.infoIconContainer}>
        <Icono
          name="shield-account"
          size={moderateScale(42)}
          color={colors.primaryColor}
        />
      </View>
      <View style={localStyle.infoTextContainer}>
        <CText
          style={localStyle.infoText} // estilo para tamaño y negrita
        >
          {String.whatIsGuardians}
        </CText>
        <Icono name="arrow-right" size={moderateScale(30)} style={styles.ml5} />
      </View>
    </TouchableOpacity>
  );
  return (
    <CSafeAreaView>
      <CHeader title={String.guardiansTitle} rightIcon={<RightIcon />} />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.ph20}>
        <CText type={'B16'} align={'center'} marginTop={15}>
          {String.guardiansSubtitle}
        </CText>
        {guardians.length == 0 && <InfoCard />}
        <FlatList
          data={visibleGuardians}
          keyExtractor={item => item.id}
          renderItem={renderGuardianOption}
          contentContainerStyle={styles.mt20}
        />
      </KeyBoardAvoidWrapper>
      <View style={localStyle.bottomTextContainer}>
        {guardians.length <= 1 && (
          <CAlert status="info" message={String.alertguardiansrequired} />
        )}

        <CButton
          title={` ${String.addGuardian}`}
          onPress={onPressAddGuardian}
          type={'B16'}
          containerStyle={localStyle.btnStyle1}
          frontIcon={<Icono size={20} name="account-plus" color={'#fff'} />}
        />
      </View>
      <GuardianOptionsModal
        visible={optionsVisible}
        onClose={() => setOptionsVisible(false)}
        currentNickname={selectedGuardian?.nickname || ''}
        onSaveNickname={newNick =>
          patchGuardianId(
            {id: selectedGuardian.id, nickname: newNick},
            {onSuccess: closeModal},
          )
        }
        onDeleteGuardian={() =>
          deleteGuardianId(selectedGuardian.id, {onSuccess: closeModal})
        }
      />

      {selectedGuardian && (
        <GuardianActionModal
          visible={modalVisible}
          guardian={selectedGuardian}
          onClose={closeModal}
          onSave={saveGuardian}
          onDelete={deleteGuardian}
        />
      )}
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
});
