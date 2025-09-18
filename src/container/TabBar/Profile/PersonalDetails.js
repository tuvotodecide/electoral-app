import {View} from 'react-native';
import React, { useMemo } from 'react';

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
import {useNavigationLogger} from '../../../hooks/useNavigationLogger';

export default function PersonalDetails({navigation, route}) {
  const colors = useSelector(state => state.theme.theme);
  const userData = useSelector(state => state.wallet.payload);
  const vc = userData?.vc;
  // Hook para logging de navegación
  const { logAction, logNavigation } = useNavigationLogger('PersonalDetails', true);
  const subject = vc?.credentialSubject || {};

  const birthSec = Number(subject.dateOfBirth);

  const birthDate = useMemo(() => {
    if (!birthSec) return null;
    return new Date(birthSec * 1000);
  }, [birthSec]);

  const formattedBirth = birthDate
    ? birthDate.toLocaleDateString('es-ES')
    : '(sin fecha)';

  const data = {
    name: subject.fullName || '(sin nombre)',
    document: subject.governmentIdentifier || '(sin doc)',
    birthDate: formattedBirth,
  
    hash: userData?.account?.slice(0, 10) + '…' || '(sin hash)',
  };
  return (
    <CSafeAreaView testID="personalDetailsContainer">
      <CHeader testID="personalDetailsHeader" title={String.personalDetailsTitle} />
      <KeyBoardAvoidWrapper testID="personalDetailsKeyboardWrapper" contentContainerStyle={styles.ph20}>
        <View testID="personalDetailsAvatarContainer" style={{alignItems: 'center', width: '100%'}}>
          <Icono testID="personalDetailsAvatarIcon" name="account" size={150} color={colors.primary} />
         <CHash testID="personalDetailsHash" text={data.hash} title={userData?.account}/>
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
        {/* <CEtiqueta
          icon={<Icono name="flag" color={getSecondaryTextColor(colors)} />}
          title={String.nationalityTitle}
          text={data.nationality}
        /> */}
      </KeyBoardAvoidWrapper>
    </CSafeAreaView>
  );
}
