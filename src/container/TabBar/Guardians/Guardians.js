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

export default function Guardians({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState(null);
  const {data = [], error, isLoading} = useMyGuardiansAllListQuery();
  const {mutate: deleteGuardianId, isLoading: loading} =
    useGuardianDeleteQuery();
  const {mutate: patchGuardianId, isLoading: loadingpatch} =
    useGuardianPatchQuery();

  console.log(selectedGuardian);

  const guardians = useMemo(() => data.map(edge => edge.node), [data]);

  const statusColorKey = {
    ACCEPTED: 'activeColor',
    PENDING: 'pendingColor',
    REJECTED: 'rejectedColor',
    REMOVED: 'rejectedColor',
  };
  // Etiquetas según status
  const statusLabel = {
    ACCEPTED: String.active,
    PENDING: String.pending,
    REJECTED: String.rejected,
    REMOVED: String.removed ?? 'Removido',
  };

  const onPressAddGuardian = () => {
    navigation.navigate(StackNav.AddGuardians);
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
  const RightIcon = () => {
    return (
      <TouchableOpacity>
        {colors.dark ? <Short_White /> : <Short_Black />}
      </TouchableOpacity>
    );
  };

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

  return (
    <CSafeAreaView>
      <CHeader title={String.guardiansTitle} rightIcon={<RightIcon />} />
      <View style={styles.ph20}>
        <CText type={'B16'} align={'center'} marginTop={15}>
          {String.guardiansSubtitle}
        </CText>
        <FlatList
          data={guardians}
          keyExtractor={item => item.id}
          renderItem={renderGuardianOption}
          contentContainerStyle={styles.mt20}
        />
      </View>
      <View style={localStyle.bottomTextContainer}>
        <CButton
          title={` ${String.addGuardian}`}
          onPress={onPressAddGuardian}
          type={'B16'}
          containerStyle={localStyle.btnStyle}
          frontIcon={<Icono size={20} name="account-plus" color={'#fff'} />}
        />
      </View>
      <GuardianActionModal
        visible={modalVisible}
        guardian={selectedGuardian}
        onClose={closeModal}
        onDelete={deleteGuardian}
        onSave={saveGuardian}
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
});
