import { set, get, has } from 'lodash';
import { EventEmitter } from 'events';

export type IInjectConfig = {
  [pluginName: string]: {
    [resourceName: string]: {
      [viewName: string]: boolean;
    } | boolean;

    global?: boolean;
  };
};

export class InjectConfig {
  _config: IInjectConfig = JSON.parse(localStorage.getItem('___inject_config___') || '{}');

  event: EventEmitter = new EventEmitter()

  get config() {
    return this._config;
  }

  onChange(fn: (config: IInjectConfig) => void) {
    this.event.on('changeConfig', fn);
    return () => {
      this.event.off('changeConfig', fn)
    }
  }

  set(pluginName, resourceName, viewName, injected: boolean) {
    if (!viewName) {
      set(this._config, [pluginName, resourceName], injected);
      this._config = {
        ...this._config,
      }
      this.event.emit('changeConfig', this.config);
      return;
    }

    set(this._config, [pluginName, resourceName, viewName], injected);

    this._config = {
      ...this._config,
    }

    this.event.emit('changeConfig', this.config);
  }

  get(pluginName, resourceName, viewName?) {
    if (!viewName) {
      return get(this._config, [pluginName, resourceName], false)
    }
    return get(this._config, [pluginName, resourceName, viewName], false)
  }

  has(pluginName, resourceName, viewName?) {
    if (!viewName) {
      return has(this._config, [pluginName, resourceName])
    }
    return has(this._config, [pluginName, resourceName, viewName])
  }

  clearAll() {
    this._config = {};
  }

  save() {
    localStorage.setItem('___inject_config___', JSON.stringify(this._config));
  }
}