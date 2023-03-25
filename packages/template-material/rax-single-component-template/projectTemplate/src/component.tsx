import { createElement, forwardRef, ForwardRefRenderFunction } from 'rax';
import View from 'rax-view';
import Text from 'rax-text';
import './style.scss';

export interface ComponentProps {
  /**
   * 名称
   */
  name: string;
  /**
   * 子节点
   */
  children: any;
}

/**
 * 示例组件
 * @param props
 * @constructor
 */
function ExampleComponent(props: ComponentProps, ref: any) {
  return (
    <View ref={ref} className="container">
      <Text className="name">{props.name || ''}</Text>
      <Text className="content">{props.children}</Text>
    </View>
  );
}

const RefComponent = forwardRef(ExampleComponent as ForwardRefRenderFunction<any, ComponentProps>);

RefComponent.defaultProps = {
  name: '标题',
};
RefComponent.displayName = 'ExampleComponent';

export default RefComponent;
