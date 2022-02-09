import * as React from 'react';
import { Switch } from '@alifd/next';
import './style.less';

class <%- componentName %> extends React.Component<{
  onChange: (any) => void,
  value: boolean,
  defaultValue: boolean,
}> {
  static displayName = '<%- componentName %>';

  render() {
    const { onChange, value, defaultValue } = this.props;
    const props: any = {
      defaultChecked: defaultValue,
      onChange,
    };
    if (typeof value !== 'undefined') {
      props.checked = value;
    }
    return <Switch {...props} className="<%- name %>" />;
  }
}

export default <%- componentName %>;
