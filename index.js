import 'react-native-gesture-handler';
/**
 * @format
 */

import {AppRegistry, LogBox} from 'react-native';
import App from './App';

LogBox.ignoreLogs(['InteractionManager has been deprecated']);
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
