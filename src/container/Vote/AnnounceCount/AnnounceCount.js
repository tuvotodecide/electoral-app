import React, {useEffect} from 'react';
import {StackNav} from '../../../navigation/NavigationKey';

export default function AnnounceCount({navigation}) {
  useEffect(() => {
    // Navegar inmediatamente a SearchCountTable
    navigation.replace(StackNav.SearchCountTable);
  }, [navigation]);

  return null; // No renderizar nada ya que navegamos inmediatamente
}
