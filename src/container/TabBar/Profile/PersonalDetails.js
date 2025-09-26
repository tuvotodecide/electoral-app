import {View} from 'react-native';
import React, {useMemo} from 'react';

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

export default function PersonalDetails({navigation, route}) {
  const colors = useSelector(state => state.theme.theme);
  const userData = useSelector(state => state.wallet.payload);
  const vc = userData?.vc;
  const subject = getCredentialSubjectFromPayload(userData) || {};
  const birthSec = Number(subject.birthDate);

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
  return (
    <CSafeAreaView>
      <CHeader title={String.personalDetailsTitle} />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.ph20}>
        <View style={{alignItems: 'center', width: '100%'}}>
          <Icono name="account" size={150} color={colors.primary} />
          <CHash text={data.hash} title={userData?.account} />
        </View>

        <CEtiqueta
          icon={<Icono name="account" color={getSecondaryTextColor(colors)} />}
          title={String.fullNameTitle}
          text={data.name}
        />
        <CEtiqueta
          icon={
            <Icono
              name="card-account-details"
              color={getSecondaryTextColor(colors)}
            />
          }
          title={String.documentTitle}
          text={data.document}
        />
        <CEtiqueta
          icon={<Icono name="calendar" color={getSecondaryTextColor(colors)} />}
          title={String.birthDateTitle}
          text={data.birthDate}
        />
        {/* <CEtiqueta
          icon={<Icono name="flag" color={getSecondaryTextColor(colors)} />}
          title={String.nationalityTitle}
          text={data.nationality}
        /> */}
      </KeyBoardAvoidWrapper>
    </CSafeAreaView>
  );
}
