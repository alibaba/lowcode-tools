import { init, plugins } from '@alilc/lowcode-engine';
import DemoPlugin from '__lowcode-plugin-demo__';
import basePlugin from './universal/plugin';
import './universal/global.scss';


(async () => {
  await plugins.register(DemoPlugin);
  await basePlugin({ type: 'plugin', demoPlugin: DemoPlugin });

  init(document.getElementById('lce-container'), {
    enableCondition: true,
    enableCanvasLock: true,
    disableDefaultSettingPanel: false,
    disableDefaultSetters: false,
    stayOnTheSameSettingTab: false,
    simulatorUrl: [
      'https://cdn.jsdelivr.net/npm/@alilc/lowcode-react-simulator-renderer@^1.0.0/dist/js/react-simulator-renderer.js',
      'https://cdn.jsdelivr.net/npm/@alilc/lowcode-react-simulator-renderer@^1.0.0/dist/css/react-simulator-renderer.css'
    ],
  });

})()


