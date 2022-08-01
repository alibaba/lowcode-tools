import * as React from 'react';
import { Input } from 'antd'
import { createElement } from 'react';

export interface IAntdSetterProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (val: string) => void;
}

const InputSetter: React.FC<IAntdSetterProps> = ({
  onChange,
  placeholder = '请输入',
  value,
}) => {
  return (
    <div>
      <Input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          const val = e.currentTarget.value;
          onChange?.(val);
        }}
        style={{ width: '100%' }}
      />
    </div>
  );
};

export default InputSetter;
