import {StyleSheet} from 'react-native';
import React from 'react';

// custom imports
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import {styles} from '../../../themes';
import CText from '../../../components/common/CText';
import CTagText from '../../../components/common/CTagText';
import Icono from '../../../components/common/Icono';
import {getSecondaryTextColor} from '../../../utils/ThemeUtils';
import {useSelector} from 'react-redux';
import String from '../../../i18n/String';

export default function RewardHistory() {
  const colors = useSelector(state => state.theme.theme);

  const data = {
    accumulatedAmount: '50',
    pendingInvitationsSent: '9',
    registeredInvitations: '2',
  };

  function getIconByKey(key, color) {
    switch (key) {
      case 'accumulatedAmount':
        return <Icono name="currency-usd" color={color} />;
      case 'pendingInvitationsSent':
        return <Icono name="clock" color={color} />;
      case 'registeredInvitations':
        return <Icono name="check-circle" color={color} />;
      default:
        return <Icono name="information" color={color} />;
    }
  }

  return (
    <CSafeAreaView>
      <CHeader title={String.viewMyRewards} />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.ph20}>
        <CText type="B16" marginTop={20} color={getSecondaryTextColor(colors)}>
          {String.rewardHistoryDescription}
        </CText>

        <CTagText
          iconLeft={getIconByKey('accumulatedAmount', colors.primary)}
          title={String.accumulatedAmount}
          subtitle={`${data.accumulatedAmount} WIRA`}
        />
        <CTagText
          iconLeft={getIconByKey('pendingInvitationsSent', colors.primary)}
          title={String.pendingInvitationsSent}
          subtitle={data.pendingInvitationsSent}
        />
        <CTagText
          iconLeft={getIconByKey('registeredInvitations', colors.primary)}
          title={String.registeredInvitations}
          subtitle={data.registeredInvitations}
        />
      </KeyBoardAvoidWrapper>
    </CSafeAreaView>
  );
}
