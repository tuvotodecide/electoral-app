/**
 * Dependency Inversion Principle (DIP):
 * Abstracción de Navegación. 
 * En React Native, inyectar el objeto destructurado "{ navigation }" 
 * directamente en la lógica de negocio obliga a toda tu app a depender 
 * de la sintaxis exacta de "React Navigation". 
 * Si mañana decides encender y migrar por completo a Expo Router (el cual 
 * veo que ya tienes en el package.json), este adaptador es el único archivo 
 * que cambiará a "router.replace()", salvando decenas de componentes.
 */
export const NavigationAdapter = (navigationRef) => {
  return {
    navigate: (route, params) => {
      if (params) {
        navigationRef.navigate(route, params);
      } else {
        navigationRef.navigate(route);
      }
    },
    replace: (route, params) => {
      if (params) {
        navigationRef.replace(route, params);
      } else {
        navigationRef.replace(route);
      }
    }
  };
};
