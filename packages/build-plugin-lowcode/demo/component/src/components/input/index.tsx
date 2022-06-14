import * as React from 'react';
import { Input } from '@alifd/next';

interface ComponentProps {
  title: string;
}

export default function ComponentB(props: ComponentProps) {
  const { title, ...others } = props;

  return (
    <div className="ExampleComponent">
      { title }
      <Input { ...others }/>
    </div>
  );
}
