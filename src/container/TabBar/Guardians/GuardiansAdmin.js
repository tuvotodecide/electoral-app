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
import String from '../../../i18n/String';
import {FlatList} from 'react-native-gesture-handler';
import {useSelector} from 'react-redux';
import {
  useGuardianInvitationActionQuery,
  useMyGuardianInvitationsListQuery,
  useMyGuardianRecoveryListQuery,
  useRecoveryActionQuery,
} from '../../../data/guardians';
import GuardianInfoActionModal from '../../../components/modal/GuardianInfoModal';

import { truncateDid } from '../../../utils/Address';

export default function GuardiansAdmin() {
  const colors = useSelector(state => state.theme.theme);

  const userData = useSelector(state => state.wallet.payload);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState(null);
  const did = userData?.did;
  const {data: invData = []} = useMyGuardianInvitationsListQuery({did});

  const {data: recData = []} =
    useMyGuardianRecoveryListQuery({did});
  const {mutate: mutateInvitation, isLoading: loadingInvitationAction} =
    useGuardianInvitationActionQuery();
  const {mutate: mutateRecovery, isLoading: loadingRecoveryAction} =
    useRecoveryActionQuery();

  const handleAcceptInvitation = async id => {
    const inv = invData.find(i => i.id === id);
    if (!inv) return;
    mutateInvitation({id, did: userData.did, action: 'accept'});
  };
  const handleRejectInvitation = id => {
    if (!did) {
      return;
    }
    mutateInvitation(
      {id, did, action: 'reject'},
    );
  };

  const handleApproveRecovery = async id => {
    mutateRecovery({id, action: 'approve', did: userData.did});
  };
  const handleRejectRecovery = id => {
    if (!did) {
      return;
    }
    mutateRecovery(
      {id, action: 'reject', did},
    );
  };

  const invitations = useMemo(
    () => invData.filter(i => i.status === 'PENDING'),
    [invData],
  );
  const recoveries = useMemo(
    () => recData.filter(r => r.status === 'PENDING'),
    [recData],
  );
  const accepted = useMemo(
    () => invData.filter(i => i.status === 'ACCEPTED'),
    [invData],
  );

  const openModal = item => {
    setSelectedGuardian(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedGuardian(null);
  };

  const renderGuardianOption = ({item}) => {
    const parts = (item.inviter?.displayNamePublic || '').split(' ');
    const firstSegment = parts[0] || '';
    const secondSegment = parts[1] || '';

    const displayName = secondSegment
      ? `${firstSegment} ${secondSegment}`
      : firstSegment;
    const inviterDid = truncateDid(item.inviterDid);

    return (
      <TouchableOpacity
        testID={`guardiansAdminProtectedItem_${item.governmentIdentifier}`}
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
        <View testID={`guardiansAdminProtectedItemContent_${item.governmentIdentifier}`} style={styles.rowCenter}>
          <View
            testID={`guardiansAdminProtectedItemIcon_${item.governmentIdentifier}`}
            style={[
              localStyle.iconBg,
              {
                borderColor: colors.dark
                  ? colors.stepBackgroundColor
                  : colors.grayScale200,
              },
            ]}>
            <Icono testID={`guardiansAdminProtectedItemAccountIcon_${item.governmentIdentifier}`} name="account" size={moderateScale(24)} />
          </View>
          <View testID={`guardiansAdminProtectedItemInfo_${item.governmentIdentifier}`} style={styles.ml10}>
            <View testID={`guardiansAdminProtectedItemIdRow_${item.governmentIdentifier}`} style={styles.rowCenter}>
              <CText testID={`guardiansAdminProtectedItemId_${item.governmentIdentifier}`} type="B16">{inviterDid}</CText>
            </View>
            <CText testID={`guardiansAdminProtectedItemName_${item.governmentIdentifier}`} type="R12" color={colors.grayScale500}>
              {displayName === "" ? '(sin nombre)' : displayName}
            </CText>
          </View>
        </View>
        <TouchableOpacity testID={`guardiansAdminProtectedItemMenu_${item.governmentIdentifier}`} onPress={() => openModal(item)}>
          <Icono
            testID={`guardiansAdminProtectedItemMenuIcon_${item.governmentIdentifier}`}
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

    const targetDid = truncateDid(item.targetDid);
    const createDate = new Date(item.createdAt * 1000);

    const createdAt = createDate.toLocaleDateString() + ' ' + createDate.toLocaleTimeString();

    return (
      <View
        testID={`guardiansAdminRecoveryItem_${item.governmentIdentifier}`}
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
        <View testID={`guardiansAdminRecoveryItemContent_${item.governmentIdentifier}`} style={styles.rowCenter}>
          <View
            testID={`guardiansAdminRecoveryItemIcon_${item.governmentIdentifier}`}
            style={[
              localStyle.iconBg,
              {
                borderColor: colors.dark
                  ? colors.stepBackgroundColor
                  : colors.grayScale200,
              },
            ]}>
            <Icono testID={`guardiansAdminRecoveryItemAccountIcon_${item.governmentIdentifier}`} name="account" size={moderateScale(24)} />
          </View>
          <View testID={`guardiansAdminRecoveryItemInfo_${item.governmentIdentifier}`} style={styles.ml10}>
            <View testID={`guardiansAdminRecoveryItemNameRow_${item.governmentIdentifier}`}>
              <CText testID={`guardiansAdminRecoveryItemName_${item.governmentIdentifier}`} type="B16">{displayName === '' ? targetDid : displayName}</CText>
            </View>
            <CText testID={`guardiansAdminRecoveryItemId_${item.governmentIdentifier}`} type="R12" color={colors.grayScale500}>
              {createdAt}
            </CText>
          </View>
        </View>
        <View testID={`guardiansAdminRecoveryItemActions_${item.governmentIdentifier}`} style={localStyle.actionsRow}>
          <CButton
            testID={`guardiansAdminRecoveryItemApprove_${item.governmentIdentifier}`}
            title={String.accept}
            type="B16"
            bgColor={'#4caf50'}
            disabled={loadingRecoveryAction}
            onPress={() => handleApproveRecovery(item.requestId)}
            containerStyle={[
              localStyle.actionButton,
              {backgroundColor: '#4caf50'},
            ]}
          />
          <CButton
            testID={`guardiansAdminRecoveryItemReject_${item.governmentIdentifier}`}
            title={String.reject}
            type="B16"
            disabled={loadingRecoveryAction}
            onPress={() => handleRejectRecovery(item.requestId)}
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
    const parts = (item.inviter?.displayNamePublic || '').split(' ');
    const firstSegment = parts[0] || '';
    const secondSegment = parts[1] || '';

    const displayName = secondSegment
      ? `${firstSegment} ${secondSegment}`
      : firstSegment;

    const inviterDid = truncateDid(item.inviterDid);

    return (
      <View
        testID={`guardiansAdminInvitationItem_${item.governmentIdentifier}`}
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
        <View testID={`guardiansAdminInvitationItemContent_${item.governmentIdentifier}`} style={styles.rowCenter}>
          <View
            testID={`guardiansAdminInvitationItemIcon_${item.governmentIdentifier}`}
            style={[
              localStyle.iconBg,
              {
                borderColor: colors.dark
                  ? colors.stepBackgroundColor
                  : colors.grayScale200,
              },
            ]}>
            <Icono testID={`guardiansAdminInvitationItemAccountIcon_${item.governmentIdentifier}`} name="account" size={moderateScale(24)} />
          </View>
          <View testID={`guardiansAdminInvitationItemInfo_${item.governmentIdentifier}`} style={styles.ml10}>
            <View testID={`guardiansAdminInvitationItemIdRow_${item.governmentIdentifier}`} style={styles.rowCenter}>
              <CText testID={`guardiansAdminInvitationItemId_${item.governmentIdentifier}`} type="B16">
                {displayName === '' ? '(nombre no visible)' : displayName}
              </CText>
            </View>
            <CText testID={`guardiansAdminInvitationItemName_${item.governmentIdentifier}`} type="R12" color={colors.grayScale500}>
              {inviterDid}
            </CText>
          </View>
        </View>
        <View testID={`guardiansAdminInvitationItemActions_${item.governmentIdentifier}`} style={localStyle.actionsRow}>
          <CButton
            testID={`guardiansAdminInvitationItemAccept_${item.governmentIdentifier}`}
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
            testID={`guardiansAdminInvitationItemReject_${item.governmentIdentifier}`}
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
    <CSafeAreaView testID="guardiansAdminContainer" addTabPadding={false}>
      <CHeader testID="guardiansAdminHeader" title={String.myProtected} />
      <KeyBoardAvoidWrapper testID="guardiansAdminKeyboardWrapper" contentContainerStyle={styles.ph20}>
        <CText testID="guardiansAdminInvitationsTitle" type={'B16'} align={'center'} marginTop={15}>
          {String.myInvitations}
        </CText>
        <FlatList
          testID="guardiansAdminInvitationsList"
          data={invitations}
          keyExtractor={item => item.requestId}
          renderItem={renderInvitationOption}
          contentContainerStyle={styles.mt20}
          scrollEnabled={false} 
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={8}
        />
        <CText testID="guardiansAdminRecoveryTitle" type={'B16'} align={'center'} marginTop={15}>
          {String.myRecovery}
        </CText>
        <FlatList
          testID="guardiansAdminRecoveryList"
          data={recoveries}
          keyExtractor={item => item.id}
          renderItem={renderRevoceryOption}
          contentContainerStyle={styles.mt20}
          scrollEnabled={false} 
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={8}
        />
        <CText testID="guardiansAdminProtectedTitle" type={'B16'} align={'center'} marginTop={15}>
          {String.myProtectedInfo}
        </CText>
        <FlatList
          testID="guardiansAdminProtectedList"
          data={accepted}
          keyExtractor={item => item.id}
          renderItem={renderGuardianOption}
          contentContainerStyle={styles.mt20}
          scrollEnabled={false} 
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={8}
        />
      </KeyBoardAvoidWrapper>
      <GuardianInfoActionModal
        testID="guardiansAdminInfoModal"
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
