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

export default function PersonalDetails() {
  const colors = useSelector(state => state.theme.theme);
  const userData = useSelector(state => state.wallet.payload);
  const [showName, setShowName] = useState({
    value: false,
    loading: true,
    errorMsg: null,
  });

  useEffect(() => {
    async function fetchDisplayName() {
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

  const onSwitchShowName = async (_, value) => {
    setShowName({
      value: showName.value,
      loading: true,
    });
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
    setShowName({
      value,
      loading: false,
    });
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
            title={userData?.account}
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
      </KeyBoardAvoidWrapper>
    </CSafeAreaView>
  );
}