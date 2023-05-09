import { setters, init } from '@alilc/lowcode-engine';
import DemoSetter from '__lowcode-setter-demo__';
import basePlugin from './universal/plugin';
import './universal/global.scss';



(async () => {
  await basePlugin({ type: 'setter' });
  setters.registerSetter('DemoSetter', DemoSetter);

  init(document.getElementById('lce-container'), {
    enableCondition: true,
    enableCanvasLock: true,
  });
})()