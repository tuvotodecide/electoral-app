import React from 'react';

import CAlert from '../../components/common/CAlert';
import String from '../../i18n/String';
import {useIsDemoActive} from './demoSession';

/**
 * Aviso permanente de modo demostración.
 *
 * Es lo que convierte la cuenta de demostración en una función declarada y no
 * en una función oculta (directriz 2.3.1 de App Store).
 */
export default function DemoBanner({testID = 'demoModeBanner'}) {
  const isDemo = useIsDemoActive();

  if (!isDemo) {
    return null;
  }

  return <CAlert testID={testID} status="info" message={String.demoModeBanner} />;
}
