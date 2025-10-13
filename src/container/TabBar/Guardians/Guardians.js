import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useMemo, useState} from 'react';

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
import GuardianActionModal from '../../../components/modal/GuardianActionModal';
import {StackNav} from '../../../navigation/NavigationKey';
import {
  useGuardianDeleteQuery,
  useGuardianPatchQuery,
  useMyGuardiansAllListQuery,
} from '../../../data/guardians';
import CAlert from '../../../components/common/CAlert';
import {ActivityIndicator} from 'react-native-paper';
import {useNavigationLogger} from '../../../hooks/useNavigationLogger';

const statusColorKey = {
  ACCEPTED: 'activeColor',
  PENDING: 'pendingColor',
  REJECTED: 'rejectedColor',
  REMOVED: 'rejectedColor',
};

export default function Guardians({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState(null);
  const walletPayload = useSelector(state => state.wallet.payload);
  const did = walletPayload?.did;

  const {data: guardians = [], error, isLoading} = useMyGuardiansAllListQuery({did});
  const {mutate: deleteGuardianId, isLoading: loading} =
    useGuardianDeleteQuery();
  const {mutate: patchGuardianId, isLoading: loadingpatch} =
    useGuardianPatchQuery();

  const visibleGuardians = useMemo(
    () =>
      guardians.filter(g => g.status === 'ACCEPTED' || g.status === 'PENDING'),
    [guardians],
  );

  const statusLabel = {
    ACCEPTED: String.active,
    PENDING: String.pending,
    REJECTED: String.rejected,
    REMOVED: String.removed ?? 'Removido',
  };

  const onPressAddGuardian = () => {
    logNavigation(StackNav.AddGuardians);
    navigation.navigate(StackNav.AddGuardians);
  };
  const onPressMyProtected = () => {
    logNavigation(StackNav.GuardiansAdmin);
    navigation.navigate(StackNav.GuardiansAdmin);
  };
  const onPressWatchInfoGuardian = () => {
    logNavigation(StackNav.OnBoardingGuardians);
    navigation.navigate(StackNav.OnBoardingGuardians);
  };

  const openModal = item => {
    logAction('OpenGuardianActionModal', {guardianId: item.id});
    setSelectedGuardian(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    logAction('CloseGuardianActionModal');
    setModalVisible(false);
    setSelectedGuardian(null);
  };

  const deleteGuardian = async () => {
    if (!selectedGuardian?.id || !did) {
      logAction('DeleteGuardianMissingData');
      return;
    }
    try {
      deleteGuardianId({
        invId: selectedGuardian.id,
        ownerDid: did,
      }, {onSuccess: () => {
        logAction('DeleteGuardianSuccess', {guardianId: selectedGuardian.id});
        closeModal();
      }});
    } catch (e) {
      logAction('DeleteGuardianError', {message: e?.message});
    }
  };
  const saveGuardian = newNick => {
    if (!selectedGuardian?.id || !did) {
      logAction('SaveGuardianMissingData');
      return;
    }
    patchGuardianId(
      {invId: selectedGuardian.id, ownerDid: did, nickname: newNick},
      {
        onSuccess: () => {
          logAction('SaveGuardianSuccess', {guardianId: selectedGuardian.id});
          closeModal();
        },
        onError: err => {
          logAction('SaveGuardianError', {message: err?.message});
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
    <View testID="guardiansRightIcons" style={localStyle.rightIcons}>
      <TouchableOpacity testID="guardiansInfoButton" onPress={onPressWatchInfoGuardian}>
        {guardians.length !== 0 && (
          <Icono
            testID="guardiansInfoIcon"
            name="message-question"
            size={moderateScale(28)}
            color={colors.primaryColor}
          />
        )}
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View testID="guardiansLoadingContainer" style={localStyle.loaderContainer}>
        <ActivityIndicator testID="guardiansLoadingIndicator" size="large" color={colors.primaryColor} />
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
    const inviterDid = item.guardianDid?.slice(22, 31) + '...' + item.guardianDid?.slice(-4);

    const colorKey = statusColorKey[item.status] || 'pendingColor';
    return (
      <TouchableOpacity
        testID={`guardiansListItem_${item.id}`}
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
        <View testID={`guardiansListItemContent_${item.id}`} style={styles.rowCenter}>
          <View
            testID={`guardiansListItemIcon_${item.id}`}
            style={[
              localStyle.iconBg,
              {
                borderColor: colors.dark
                  ? colors.stepBackgroundColor
                  : colors.grayScale200,
              },
            ]}>
            <Icono testID={`guardiansListItemAccountIcon_${item.id}`} name="account" size={moderateScale(24)} />
          </View>
          <View testID={`guardiansListItemInfo_${item.id}`} style={styles.ml10}>
            <View testID={`guardiansListItemNameRow_${item.id}`} style={styles.rowCenter}>
              <CText testID={`guardiansListItemName_${item.id}`} type="B16">{displayName}</CText>

              <View
                testID={`guardiansListItemBadge_${item.id}`}
                style={[localStyle.badge, {backgroundColor: colors[colorKey]}]}>
                <CText testID={`guardiansListItemStatus_${item.id}`} type="R12" color={colors.white}>
                  {statusLabel[item.status]}
                </CText>
              </View>
            </View>
            <CText testID={`guardiansListItemNickname_${item.id}`} type="R12" color={colors.grayScale500}>
              {item.nickname ?? '(sin apodo)'}
            </CText>
          </View>
        </View>
        <TouchableOpacity testID={`guardiansListItemMenu_${item.id}`} onPress={() => openModal(item)}>
          <Icono
            testID={`guardiansListItemMenuIcon_${item.id}`}
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
      testID="guardiansInfoCard"
      style={[
        localStyle.infoCard,
        {
          backgroundColor: colors.stepBackgroundColor,
          borderColor: colors.dark ? colors.grayScale700 : colors.grayScale200,
        },
      ]}
      activeOpacity={0.7}
      onPress={onPressWatchInfoGuardian}>
      <View testID="guardiansInfoCardIconContainer" style={localStyle.infoIconContainer}>
        <Icono
          testID="guardiansInfoCardIcon"
          name="shield-account"
          size={moderateScale(42)}
          color={colors.primaryColor}
        />
      </View>
      <View testID="guardiansInfoCardTextContainer" style={localStyle.infoTextContainer}>
        <CText
          testID="guardiansInfoCardText"
          style={localStyle.infoText}>
          {String.whatIsGuardians}
        </CText>
        <Icono testID="guardiansInfoCardArrow" name="arrow-right" size={moderateScale(30)} style={styles.ml5} />
      </View>
    </TouchableOpacity>
  );
  return (
    <CSafeAreaView addTabPadding={false} testID="guardiansContainer">
      <CHeader
        title={String.guardiansTitle}
        rightIcon={<RightIcon />}
        testID="guardiansHeader"
      />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.ph20} testID="guardiansKeyboardWrapper">
        <CText type={'B16'} align={'center'} marginTop={15} testID="guardiansSubtitle">
          {String.guardiansSubtitle}
        </CText>
        {guardians.length == 0 && <InfoCard />}
        <FlatList
          data={visibleGuardians}
          keyExtractor={item => item.id}
          renderItem={renderGuardianOption}
          contentContainerStyle={styles.mt20}
          scrollEnabled={false} 
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={8}
          testID="guardiansList"
        />
      </KeyBoardAvoidWrapper>
      <View testID="guardiansBottomContainer" style={localStyle.bottomTextContainer}>
        {guardians.length <= 1 && (
          <CAlert testID="guardiansRequiredAlert" status="info" message={String.alertguardiansrequired} />
        )}

        <CButton
          testID="guardiansAddButton"
          title={` ${String.addGuardian}`}
          onPress={onPressAddGuardian}
          type={'B16'}
          containerStyle={localStyle.btnStyle1}
          frontIcon={<Icono testID="guardiansAddButtonIcon" size={20} name="account-plus" color={'#fff'} />}
        />
      </View>
      {/* <GuardianOptionsModal
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
      /> */}

      {selectedGuardian && (
        <GuardianActionModal
          visible={modalVisible}
          guardian={selectedGuardian}
          onClose={closeModal}
          onSave={saveGuardian}
          onDelete={deleteGuardian}
          testID="guardiansActionModal"
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
