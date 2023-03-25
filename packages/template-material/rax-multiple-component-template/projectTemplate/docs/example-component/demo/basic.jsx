/**
 * @title 基础
 * @desc 这是一个基础 demo
 * @order 1
 */
/* @jsx createElement */
import { createElement } from 'rax';
import { ExampleComponent } from '<%= projectName %>';

export default () => {
  return <ExampleComponent name="示例">组件示例</ExampleComponent>;
};
