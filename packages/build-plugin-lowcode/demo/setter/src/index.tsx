import * as React from 'react';

import { Select, Icon } from '@alifd/next';

class AdvancedSelectSetter extends React.Component {

  render () {
    const { value, onChange, dataSource, options, helpUrl="https://fusion.design" } = this.props;

    return <div>
      <Select dataSource={options || dataSource} value={value} onChange={onChange}/>
      <a href={helpUrl} target="_blank" ><Icon type="help" /></a>
    </div>

  }

}

export default AdvancedSelectSetter;