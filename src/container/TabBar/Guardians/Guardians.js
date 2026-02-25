import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useMemo, useRef, useState} from 'react';

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
  guardianApi,
  useGuardianDeleteQuery,
  useGuardianPatchQuery,
  useGuardiansThresholdQuery,
  useMyGuardiansAllListQuery,
} from '../../../data/guardians';
import CAlert from '../../../components/common/CAlert';
import {ActivityIndicator} from 'react-native-paper';

import { truncateDid } from '../../../utils/Address';
import ActionSheet from 'react-native-actions-sheet';
import CInput from '../../../components/common/CInput';
import CIconButton from '../../../components/common/CIconButton';

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
  const guardianSettings = useRef(null);
  const [guardianThreshold, setGuardianThreshold] = useState('1');
  const [thresholdError, setThresholdError] = useState(null);

  const {data: guardians = [], error, isLoading} = useMyGuardiansAllListQuery({did});
  const {data: gotThreshold} = useGuardiansThresholdQuery({did});
  const {mutate: deleteGuardianId} =
    useGuardianDeleteQuery();
  const {mutate: patchGuardianId} =
    useGuardianPatchQuery();

  useEffect(() => {
    if(gotThreshold) {
      setGuardianThreshold(gotThreshold.toString());
    }
  }, [gotThreshold])

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
    navigation.navigate(StackNav.AddGuardians);
  };
  const onPressMyProtected = () => {
    navigation.navigate(StackNav.GuardiansAdmin);
  };
  const onPressWatchInfoGuardian = () => {
    navigation.navigate(StackNav.OnBoardingGuardians);
  };
  const onPressGuardiansThreshold = () => {
    guardianSettings.current?.show();
  };

  const onSaveGuardianThreshold = async () => {
    setThresholdError(null);
    const intThreshold = parseInt(guardianThreshold, 10);
    if (isNaN(intThreshold) || intThreshold < 1) {
      setThresholdError(String.invalidThreshold);
      throw new Error('Invalid threshold');
    }

    try {
      const response = await guardianApi.updateThreshold(did, intThreshold);
      if(!response.ok) {
        setThresholdError(response.error);
        throw new Error('Error updating guardian threshold');
      }
    } catch (error) {
      setThresholdError(error.message);
      throw error;
    }
  };

  const openModal = item => {
    setSelectedGuardian(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedGuardian(null);
  };

  const deleteGuardian = async () => {
    if (!selectedGuardian?.id || !did) {
      return;
    }
    try {
      deleteGuardianId({
        invId: selectedGuardian.id,
        ownerDid: did,
      }, {onSuccess: () => {
        closeModal();
      }});
    } catch (e) {
    }
  };
  const saveGuardian = newNick => {
    if (!selectedGuardian?.id || !did) {
      return;
    }
    patchGuardianId(
      {invId: selectedGuardian.id, ownerDid: did, nickname: newNick},
      {
        onSuccess: () => {
          closeModal();
        },
        onError: err => {
        },
      },
    );
  };
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
      <TouchableOpacity testID="guardiansThresholdButton" onPress={onPressGuardiansThreshold}>
        <Icono
          testID="guardiansThresholdIcon"
          name="tune"
          size={moderateScale(28)}
          color={colors.primaryColor}
        />
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
    const displayName = item.nickname
    const inviterDid = truncateDid(item.guardianDid);

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
            <View testID={`guardiansListItemNameRow_${item.id}`} style={styles.rowSpaceBetween}>
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
              {inviterDid}
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

      <ActionSheet ref={guardianSettings} >
        <View style={[localStyle.configContainer, {backgroundColor: colors.backgroundColor}]} >
          <CText type="B16" align="center" marginVertical={20}>{String.guardianSettings}</CText>
          <CText testID="threshholdLabel" type="R14">
            {String.threshholdLabel}
          </CText>
          <View style={localStyle.inputWrapper} testID="threshholdWrapper">
            <CInput
              _value={guardianThreshold}
              _errorText={thresholdError}
              testID="threshholdInput"
              keyBoardType='numeric'
              toGetTextFieldValue={setGuardianThreshold}
              rightAccessory={() => 
                <CIconButton name='content-save' color={colors.primary} size={moderateScale(25)} onPress={onSaveGuardianThreshold}/>
              }
            />
            
          </View>
        </View>
      </ActionSheet>
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
    gap: moderateScale(10),
    padding: moderateScale(10),
  },
  inputWrapper: {
    marginRight: moderateScale(8),
  },
  configContainer: {
    padding: moderateScale(20),
    borderTopEndRadius: moderateScale(10),
    borderTopStartRadius: moderateScale(10),
  }
});
