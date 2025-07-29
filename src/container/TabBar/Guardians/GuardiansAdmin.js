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
  useGuardianAcceptedListQuery,
  useGuardianDeleteQuery,
  useGuardianInvitationActionQuery,
  useGuardianPatchQuery,
  useMyGuardianInvitationsListQuery,
  useMyGuardianRecoveryListQuery,
  useMyGuardiansAllListQuery,
  useRecoveryActionQuery,
} from '../../../data/guardians';
import GuardianInfoActionModal from '../../../components/modal/GuardianInfoModal';
import {useKycFindPublicQuery} from '../../../data/kyc';
import {getSecrets} from '../../../utils/Cifrate';
import {
  acceptGuardianOnChain,
  approveRecoveryOnChain,
} from '../../../api/guardianOnChain';
import {CHAIN} from '@env';
import {getDeviceId} from '../../../utils/device-id';

export default function GuardiansAdmin({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState(null);
  const {data: invData = [], isLoading} = useMyGuardianInvitationsListQuery();
  const {mutate: findPublicDni} = useKycFindPublicQuery();

  const {data: recData = [], isLoading: loadingrecData} =
    useMyGuardianRecoveryListQuery();
  const {data: accData = [], isLoading: loadingdataAccepted} =
    useGuardianAcceptedListQuery();

  const {mutate: mutateInvitation, isLoading: loadingInvitationAction} =
    useGuardianInvitationActionQuery();
  const {mutate: mutateRecovery, isLoading: loadingRecoveryAction} =
    useRecoveryActionQuery();

  const handleAcceptInvitation = async id => {
    const inv = invData.map(e => e.node).find(i => i.id === id);
    if (!inv) return;
    const dni = inv.governmentIdentifier;
    const fp = await new Promise((res, rej) =>
      findPublicDni(
        {identifier: dni},
        {
          onSuccess: d => (d?.ok ? res(d) : rej(new Error('Error buscando'))),
          onError: rej,
        },
      ),
    );
    const ownerGuardianCt = fp.guardianAddress;
    const {payloadQr} = await getSecrets();
    await acceptGuardianOnChain(
      CHAIN,
      payloadQr.privKey,
      payloadQr.account,
      ownerGuardianCt,
    );

    mutateInvitation({id, action: 'accept'});
  };
  const handleRejectInvitation = id => {
    mutateInvitation({id, action: 'reject'});
  };

  const handleApproveRecovery = async id => {
    try {
      const rec = recData.map(e => e.node).find(r => r.id === id);
      if (!rec) return;

      const dni = rec.governmentIdentifier;
      const fp = await new Promise((res, rej) =>
        findPublicDni(
          {identifier: dni},
          {
            onSuccess: d =>
              d?.ok ? res(d) : rej(new Error('Error buscando usuario')),
            onError: rej,
          },
        ),
      );
      const ownerAccount = fp.accountAddress;
      const ownerGuardianCt = fp.guardianAddress;

      const {payloadQr} = await getSecrets();
      await approveRecoveryOnChain(
        CHAIN,
        payloadQr.privKey,
        payloadQr.account,
        ownerGuardianCt,
        ownerAccount,
      );

      mutateRecovery({id, action: 'approve'});
    } catch (e) {}
  };
  const handleRejectRecovery = id => {
    mutateRecovery({id, action: 'reject'});
  };

  const invitations = useMemo(
    () => invData.map(e => e.node).filter(i => i.status === 'PENDING'),
    [invData],
  );
  const recoveries = useMemo(
    () => recData.map(e => e.node).filter(r => r.status === 'PENDING'),
    [recData],
  );
  const accepted = useMemo(
    () => invData.map(e => e.node).filter(i => i.status === 'ACCEPTED'),
    [invData],
  );

  const handleAccept = id => {};
  const handleReject = id => {};

  const openModal = item => {
    setSelectedGuardian(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedGuardian(null);
  };

  const statusColorKey = {
    ACCEPTED: 'activeColor',
    PENDING: 'pendingColor',
    REJECTED: 'rejectedColor',
    REMOVED: 'rejectedColor',
  };

  const statusLabel = {
    ACCEPTED: String.active,
    PENDING: String.pending,
    REJECTED: String.rejected,
    REMOVED: String.removed ?? 'Removido',
  };

  const onPressAddGuardian = () => {
    navigation.navigate(StackNav.AddGuardians);
  };

  const renderGuardianOption = ({item}) => {
    const parts = (item.publicFullName || '').split(' ');
    const firstSegment = parts[0] || '';
    const secondSegment = parts[1] || '';

    const abbreviated = secondSegment.toUpperCase();
    const displayName = secondSegment
      ? `${firstSegment} ${abbreviated}`
      : firstSegment;

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
              <CText type="B16">{item.governmentIdentifier}</CText>
            </View>
            <CText type="R12" color={colors.grayScale500}>
              {displayName ?? '(sin apodo)'}
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

  const renderRevoceryOption = ({item}) => {
    const parts = (item.publicFullName || '').split(' ');
    const firstSegment = parts[0] || '';
    const secondSegment = parts[1] || '';

    const displayName = secondSegment
      ? `${firstSegment} ${secondSegment}`
      : firstSegment;

    return (
      <View
        style={[
          localStyle.optionContainer1,
          {
            backgroundColor: colors.backgroundColor,
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,

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
              <CText type="B16">{displayName}</CText>
            </View>
            <CText type="R12" color={colors.grayScale500}>
              {item.governmentIdentifier}
            </CText>
          </View>
        </View>
        <View style={localStyle.actionsRow}>
          <CButton
            title={String.accept}
            type="B16"
            bgColor={'#4caf50'}
            disabled={loadingRecoveryAction}
            onPress={() => handleApproveRecovery(item.id)}
            containerStyle={[
              localStyle.actionButton,
              {backgroundColor: '#4caf50'},
            ]}
          />
          <CButton
            title={String.reject}
            type="B16"
            disabled={loadingRecoveryAction}
            onPress={() => handleRejectRecovery(item.id)}
            containerStyle={[
              localStyle.actionButton,
              {backgroundColor: '#f44336'},
            ]}
          />
        </View>
      </View>
    );
  };
  const renderInvitationOption = ({item}) => {
    const parts = (item.publicFullName || '').split(' ');
    const firstSegment = parts[0] || '';
    const secondSegment = parts[1] || '';

    const displayName = secondSegment
      ? `${firstSegment} ${secondSegment}`
      : firstSegment;

    return (
      <View
        style={[
          localStyle.optionContainer1,
          {
            backgroundColor: colors.backgroundColor,
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,

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
              <CText type="B16">{item.governmentIdentifier}</CText>
            </View>
            <CText type="R12" color={colors.grayScale500}>
              {displayName ?? '(nombre no visible)'}
            </CText>
          </View>
        </View>
        <View style={localStyle.actionsRow}>
          <CButton
            title={String.accept}
            type="B16"
            bgColor={'#4caf50'}
            disabled={loadingInvitationAction}
            onPress={() => handleAcceptInvitation(item.id)}
            containerStyle={[
              localStyle.actionButton,
              {backgroundColor: '#4caf50'},
            ]}
          />
          <CButton
            title={String.reject}
            type="B16"
            disabled={loadingInvitationAction}
            onPress={() => handleRejectInvitation(item.id)}
            containerStyle={[
              localStyle.actionButton,
              {backgroundColor: '#f44336'},
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <CSafeAreaView>
      <CHeader title={String.myProtected} />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.ph20}>
        <CText type={'B16'} align={'center'} marginTop={15}>
          {String.myInvitations}
        </CText>
        <FlatList
          data={invitations}
          keyExtractor={item => item.id}
          renderItem={renderInvitationOption}
          contentContainerStyle={styles.mt20}
        />
        <CText type={'B16'} align={'center'} marginTop={15}>
          {String.myRecovery}
        </CText>
        <FlatList
          data={recoveries}
          keyExtractor={item => item.id}
          renderItem={renderRevoceryOption}
          contentContainerStyle={styles.mt20}
        />
        <CText type={'B16'} align={'center'} marginTop={15}>
          {String.myProtectedInfo}
        </CText>
        <FlatList
          data={accepted}
          keyExtractor={item => item.id}
          renderItem={renderGuardianOption}
          contentContainerStyle={styles.mt20}
        />
      </KeyBoardAvoidWrapper>
      <GuardianInfoActionModal
        visible={modalVisible}
        guardian={selectedGuardian}
        onClose={closeModal}
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
  optionContainer1: {
    flexDirection: 'column',
    alignItems: 'flex-start',
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
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: moderateScale(4),
  },
  actionButton: {
    flex: 1,
    marginHorizontal: moderateScale(4),
    borderRadius: moderateScale(8),
  },
});
