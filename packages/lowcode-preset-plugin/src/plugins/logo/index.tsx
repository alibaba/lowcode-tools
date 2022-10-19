import * as React from 'react';

import './index.scss';

export interface LogoPluginProps {
  logo: string;
  href: string;
}

export default (props: LogoPluginProps) => {
  const { logo, href } = props;
  return <a href={href}><div className='lowcode-logo-plugin'> 
    <img src={logo} />
  </div></a>;
}
