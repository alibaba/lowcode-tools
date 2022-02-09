import { init, plugins } from '@alilc/lowcode-engine';
import DemoPlugin from '__lowcode-plugin-demo__';
import basePlugin from './universal/plugin';
import './universal/global.scss';


(async () => {
  await plugins.register(DemoPlugin);
  await basePlugin({ type: 'plugin' });

  init(document.getElementById('lce-container'), {
    enableCondition: true,
    enableCanvasLock: true,
    disableDefaultSettingPanel: false,
    disableDefaultSetters: false,
    stayOnTheSameSettingTab: false,
    simulatorUrl: [
      'https://unpkg.com/@alilc/lowcode-react-simulator-renderer@beta/dist/js/react-simulator-renderer.js',
      'https://unpkg.com/@alilc/lowcode-react-simulator-renderer@beta/dist/css/react-simulator-renderer.css'
    ],
  });

})()


