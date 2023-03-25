import * as React from 'react';
import { forwardRef, ForwardRefRenderFunction } from 'react';

interface ComponentProps {
  title: string;
  content: string;
}

const ExampleComponent = (props: ComponentProps, ref: any) => {
  const { title, content, ...others } = props;

  return (
    <div ref={ref} className="ExampleComponent" {...others}>
      <h1>{title}</h1>
      {content || 'Hello ExampleComponent'}
    </div>
  );
};

const RefExampleComponent = forwardRef(ExampleComponent as ForwardRefRenderFunction<any, ComponentProps>);
RefExampleComponent.displayName = 'ExampleComponent';

export default RefExampleComponent;
