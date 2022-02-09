import * as React from 'react';
import './component.scss';

export default class BuiltIn extends React.Component<{ custom: any }> {
  props: { custom: any; };
  renderEmpty() {
    return (
      <div className="placeholder">Setter 设置的值会显示在这里</div>
    )
  }
  renderCustomProp() {
    const { custom } = this.props;
    return (
      <div className="content">
        Setter 设置的值为
        {JSON.stringify(custom, null, ' ')}
      </div>
    )
  }
  render() {
    const { custom } = this.props;
    return (
      <div className="builtin-component">
        {custom !== undefined ? this.renderCustomProp() : this.renderEmpty()}
      </div>
    )
  }
}