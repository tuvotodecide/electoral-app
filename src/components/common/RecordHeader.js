import React from 'react';
import UniversalHeader from './UniversalHeader';

export const RecordHeader = ({testID = "recordHeader", onBack, title, colors}) => (
  <UniversalHeader
    testID={testID}
    colors={colors}
    onBack={onBack}
    title={title}
    showNotification={true}
    onNotificationPress={() => {
      // Handle notification press
    }}
  />
);

export default RecordHeader;
