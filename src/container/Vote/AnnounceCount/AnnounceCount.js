import React, {useEffect} from 'react';
import {StackNav} from '../../../navigation/NavigationKey';

export default function AnnounceCount({navigation, route}) {
  useEffect(() => {
    // Navegar inmediatamente a SearchCountTable, pasando locationId si existe
    if (route?.params?.locationId) {
      navigation.replace(StackNav.SearchCountTable, {
        locationId: route.params.locationId,
        locationData: route.params.locationData,
      });
    } else {
      navigation.replace(StackNav.SearchCountTable);
    }
  }, [navigation, route]);

  return null; // No renderizar nada ya que navegamos inmediatamente
}
