import React, {useEffect} from 'react';
import {StackNav} from '../../../navigation/NavigationKey';

export default function AnunciarConteo({navigation}) {
  useEffect(() => {
    // Navegar inmediatamente a BuscarMesaConteo
    navigation.replace(StackNav.BuscarMesaConteo);
  }, [navigation]);

  return null; // No renderizar nada ya que navegamos inmediatamente
}
