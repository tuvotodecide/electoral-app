import React, {useEffect} from 'react';
import {useSelector} from 'react-redux';
import {StackNav} from '../../../navigation/NavigationKey';

export default function UploadRecord({navigation}) {
  // Navegar directamente a SearchTable cuando se monta el componente
  useEffect(() => {
    navigation.replace(StackNav.SearchTable);
  }, [navigation]);

  // Renderizar un componente vacío mientras navega
  return null;
}
