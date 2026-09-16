import React from 'react';
import CAlert from './CAlert';
import useServiceStatus from '../../hooks/useServiceStatus';

export default function ServiceStatusWarning({testID = 'serviceStatusWarning'}) {
  const status = useServiceStatus();

  if (status !== 'unavailable') {
    return null;
  }

  return (
    <CAlert
      testID={testID}
      status="warning"
      message="El servicio no está disponibe temporalmente, por favor regrese en unos minutos"
    />
  );
}
