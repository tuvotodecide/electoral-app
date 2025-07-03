import React, {useEffect} from 'react';
import {useSelector} from 'react-redux';
import {StackNav} from '../../../navigation/NavigationKey';

export default function SubirActa({navigation}) {
  // Navegar directamente a BuscarMesa cuando se monta el componente
  useEffect(() => {
    navigation.replace(StackNav.BuscarMesa);
  }, [navigation]);

  // Renderizar un componente vacío mientras navega
  return null;
}
