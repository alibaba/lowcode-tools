import React from 'react';
import './logo.scss';
import { PluginProps } from '@alilc/lowcode-types';

export interface IProps {
  logo?: string;
  href?: string;
}

const Logo: React.FC<IProps & PluginProps> = (props): React.ReactElement => {
  return (
    <div className="lowcode-plugin-logo">
      <a className="logo" target="blank" href={props.href || '/'} style={{ backgroundImage: `url(${props.logo})` }} />
    </div>
  );
};

export default Logo;