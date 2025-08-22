import React from 'react';
import UniversalHeader from './UniversalHeader';

export const RecordHeader = ({onBack, title, colors}) => (
  <UniversalHeader
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
