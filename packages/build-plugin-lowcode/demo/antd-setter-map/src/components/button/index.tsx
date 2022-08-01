import * as React from 'react';
import { Button } from '@alifd/next';

interface ComponentProps {
  title: string;
}

export default function ComponentB(props: ComponentProps) {
  const { title, children = '按钮', ...others } = props;

  return (
    <div className="ExampleComponent" {...others}>
      {title}
      <Button>{children}</Button>
    </div>
  );
}
