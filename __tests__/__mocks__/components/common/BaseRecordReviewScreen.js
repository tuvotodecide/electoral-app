import React from 'react';
import {View, TouchableOpacity, Text} from 'react-native';

const BaseRecordReviewScreen = props => {
  const {
    testID = 'baseRecordReviewScreenMock',
    actionButtons = [],
    onBack,
    partyResults,
    voteSummaryResults,
    onPartyUpdate,
    onVoteSummaryUpdate,
    headerTitle,
    instructionsText,
    colors,
    tableData,
    showTableInfo,
    ...rest
  } = props;

  return (
    <View
      testID={testID}
      {...{
        actionButtons,
        onBack,
        partyResults,
        voteSummaryResults,
        onPartyUpdate,
        onVoteSummaryUpdate,
        headerTitle,
        instructionsText,
        colors,
        tableData,
        showTableInfo,
        ...rest,
      }}
    >
      <Text testID={`${testID}HeaderTitle`}>{headerTitle}</Text>
      <Text testID={`${testID}Instructions`}>{instructionsText}</Text>
      <TouchableOpacity
        testID={`${testID}BackButton`}
        onPress={onBack}
        accessibilityLabel="back-button"
      >
        <Text>Back</Text>
      </TouchableOpacity>
      <View
        testID={`${testID}PartyResults`}
        accessibilityLabel="party-results"
      >
        <Text>{JSON.stringify(partyResults)}</Text>
      </View>
      <View
        testID={`${testID}VoteSummaryResults`}
        accessibilityLabel="vote-summary-results"
      >
        <Text>{JSON.stringify(voteSummaryResults)}</Text>
      </View>
      {actionButtons.map((button, index) => (
        <TouchableOpacity
          key={button.text || index}
          testID={`${testID}ActionButton_${index}`}
          onPress={button.onPress}
          accessibilityLabel={`action-button-${index}`}
        >
          <Text>{button.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default BaseRecordReviewScreen;
