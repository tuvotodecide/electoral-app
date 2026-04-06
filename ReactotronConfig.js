import { REACTOTRON_HOST } from '@env';
import Reactotron from "reactotron-react-native";


const host = REACTOTRON_HOST?.trim();

Reactotron.configure(
  host
    ? {
        host,
        port: 9090,
        name: "Electoral App",
      }
    : {
        port: 9090,
        name: "Electoral App",
      },
) // controls connection & communication settings
  .useReactNative() // add all built-in react native plugins
  .connect(); // let's connect!
