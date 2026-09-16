import {View} from 'react-native';
import React, {useEffect, useMemo, useState} from 'react';

//custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import {useSelector} from 'react-redux';
import {styles} from '../../../themes';
import Icono from '../../../components/common/Icono';
import CEtiqueta from '../../../components/common/CEtiqueta';
import {getSecondaryTextColor} from '../../../utils/ThemeUtils';
import CHash from '../../../components/common/CHash';
import String from '../../../i18n/String';

import {getCredentialSubjectFromPayload} from '../../../utils/Cifrate';
import COptionItem from '../../../components/common/COptionItem';
import { registryApi } from '../../../data/client/kyc';
import CAlert from '../../../components/common/CAlert';
import InfoModal from '../../../components/modal/InfoModal';
import {isDemoActive, useIsDemoActive} from '../../../features/demo/demoSession';
import DemoBanner from '../../../features/demo/DemoBanner';
import {StackNav} from '../../../navigation/NavigationKey';

const PUBLIC_NAME_CONFIRM_MESSAGE =
  'Autorizas a que tu nombre será visible para otros usuarios';

export default function PersonalDetails({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const userData = useSelector(state => state.wallet.payload);
  const [showName, setShowName] = useState({
    value: false,
    loading: true,
    errorMsg: null,
  });
  const [showPublicNameConfirmModal, setShowPublicNameConfirmModal] =
    useState(false);
  const isDemo = useIsDemoActive();

  useEffect(() => {
    async function fetchDisplayName() {
      // Sin `did` la función retorna y `loading` se queda en true para siempre
      // (spinner permanente). En demo se cierra explícitamente.
      if (isDemoActive()) {
        setShowName({value: false, loading: false, errorMsg: null});
        return;
      }
      if (!userData?.did) return;
      const data = await registryApi.resolveByDid(userData.did);
      if(!data.ok) {
        setShowName({
          value: false,
          loading: false,
          errorMsg: String.error + ': ' + data.error,
        });
        return;
      }

      setShowName({
        value: !!data?.record?.displayNamePublic,
        loading: false,
      });
    }
    fetchDisplayName();
  }, []);

  const vc = userData?.vc;

  const subject =
    getCredentialSubjectFromPayload(userData) || vc?.credentialSubject || {};
  const birthSec = Number(subject.birthDate ?? subject.dateOfBirth);


  const birthDate = useMemo(() => {
    if (!birthSec) return null;
    return new Date(birthSec * 1000);
  }, [birthSec]);
  const addr = userData?.account ?? '';

  const formattedBirth = birthDate
    ? birthDate.toLocaleDateString('es-ES')
    : '(sin fecha)';

  const data = {
    name: subject.fullName || '(sin nombre)',
    document: subject.nationalIdNumber || '(sin doc)',
    birthDate: formattedBirth,

    hash: addr ? `${addr.slice(0, 10)}…` : '(sin hash)',
  };

  const updatePublicNameVisibility = async value => {
    setShowName({
      value: showName.value,
      loading: true,
    });

    if(!isDemo) {
      const userName = userData?.vc?.credentialSubject?.fullName;
      if(!userName) {
        setShowName({
          value: showName.value,
          loading: false,
          errorMsg: String.error + ': ' + String.noNameAvailable,
        });
        return;
      }

      await registryApi.registryUpdateDisplayName(userData.did, value ? userName : null);
    }

    setShowName({
      value,
      loading: false,
    });
  };

  const onSwitchShowName = async (_, value) => {
    if (value && !showName.value) {
      setShowPublicNameConfirmModal(true);
      return;
    }

    await updatePublicNameVisibility(value);
  };

  const onCancelPublicNameVisibility = () => {
    setShowPublicNameConfirmModal(false);
  };

  const onConfirmPublicNameVisibility = async () => {
    setShowPublicNameConfirmModal(false);
    await updatePublicNameVisibility(true);
  };

  return (
    <CSafeAreaView testID="personalDetailsContainer">
      <CHeader
        testID="personalDetailsHeader"
        title={String.personalDetailsTitle}
      />
      <KeyBoardAvoidWrapper
        testID="personalDetailsKeyboardWrapper"
        contentContainerStyle={styles.ph20}>
        <DemoBanner testID="personalDetailsDemoBanner" />
        <View
          testID="personalDetailsAvatarContainer"
          style={{alignItems: 'center', width: '100%'}}>
          <Icono
            testID="personalDetailsAvatarIcon"
            name="account"
            size={150}
            color={colors.primary}
          />
          <CHash
            testID="personalDetailsHash"
            text={data.hash}
            copyContent={userData?.account}
          />
        </View>

        <CEtiqueta
          testID="personalDetailsNameField"
          icon={<Icono testID="personalDetailsNameIcon" name="account" color={getSecondaryTextColor(colors)} />}
          title={String.fullNameTitle}
          text={data.name}
        />
        <CEtiqueta
          testID="personalDetailsDocumentField"
          icon={
            <Icono
              testID="personalDetailsDocumentIcon"
              name="card-account-details"
              color={getSecondaryTextColor(colors)}
            />
          }
          title={String.documentTitle}
          text={data.document}
        />
        <CEtiqueta
          testID="personalDetailsBirthDateField"
          icon={<Icono testID="personalDetailsBirthDateIcon" name="calendar" color={getSecondaryTextColor(colors)} />}
          title={String.birthDateTitle}
          text={data.birthDate}
        />
        <COptionItem
          item={{
            id: 1,
            icon: 'eye',
            rightIcon: 'switch',
            title: String.showName,
            value: String.showNameValue
          }}
          switchValue={showName.value}
          loading={showName.loading}
          onSwitchValueChange={onSwitchShowName}
        />
        {showName.errorMsg && <CAlert status="error" message={showName.errorMsg} testID="personalDetailsErrorAlert" />}
        <COptionItem
          item={{
            id: 2,
            icon: 'trash',
            title: String.deleteAccountTitle,
            value: String.deleteAccountOptionValue,
          }}
          onPressItem={() => navigation.navigate(StackNav.DeleteAccount)}
        />
      </KeyBoardAvoidWrapper>
      <InfoModal
        testID="publicNameVisibilityConfirmModal"
        visible={showPublicNameConfirmModal}
        title={String.showName}
        message={PUBLIC_NAME_CONFIRM_MESSAGE}
        buttonText={String.accept}
        secondaryButtonText={String.cancel}
        onClose={onConfirmPublicNameVisibility}
        onSecondaryPress={onCancelPublicNameVisibility}
        secondaryButtonStyle={{backgroundColor: colors.primary4 || '#D83031'}}
        secondaryButtonTextStyle={{color: '#FFFFFF'}}
      />
    </CSafeAreaView>
  );
}
