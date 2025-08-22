import {colors} from '../../themes/colors';
import {CHANGE_THEME} from '../types';

const INITIAL_STATE = {
  theme: colors.light, // Cambiado a light por defecto
};

export default function (state = INITIAL_STATE, action) {
  switch (action.type) {
    case CHANGE_THEME:
      return {
        ...state,
        theme: action.payload,
      };
    default:
      return state;
  }
}
