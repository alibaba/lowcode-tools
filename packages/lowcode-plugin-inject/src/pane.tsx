import { Checkbox, Table, Button } from "@alifd/next";
import { IPublicModelPluginContext } from "@alilc/lowcode-types";
import * as React from 'react';
import { InjectConfig } from "./controller";

import './pane.scss'

export function Pane(props: {
  injectConfig: InjectConfig;
  pluginContext: IPublicModelPluginContext;
  updateInjectConfig: (pluginName: string, resourceName: string, viewName: string, check: boolean) => void;
  getInjectInfo(): Promise<{
    injectedSetters: any;
  }>
  injectedPluginConfigMap: any;
}) {
  const [injectInfo, setInjectInfo] = React.useState<{
    injectedSetters?: any;
  }>({});
  const [dataSource, setDataSource] = React.useState([]);

  const { workspace } = props.pluginContext;
  const options: any[] = (workspace as any).resourceTypeList.map(resource => {
    return {
      label: resource.description || resource.resourceName,
      value: resource.resourceName,
      children: resource.editorViews?.map((view) => ({
        label: view.viewName + '视图',
        value: view.viewName
      }))
    }
  });

  options.unshift({
    label: '全局',
    value: 'global',
  });

  const updateConfig = React.useCallback((config) => {
    const newDataSource = Object.entries(config).map(([key, value]) => {
      return {
        pluginName: key
      }
    }).filter(d => props.injectedPluginConfigMap[d.pluginName]);
    setDataSource(newDataSource);

    props.getInjectInfo().then(res => {
      setInjectInfo(res);
    });
  }, []);

  React.useEffect(() => {
    updateConfig(props.injectConfig.config);
    props.injectConfig.onChange((config) => {
      updateConfig(config);
    })
  }, []);

  const {
    injectedSetters,
  } = injectInfo;

  if (!dataSource?.length && !injectedSetters?.length) {
    return (
      <div className="inject-setting-panel-empty">
        <div className="inject-setting-panel-empty-title">
          未检测到调试插件/组件
        </div>
      </div>
    )
  }

  return (
    <div className="inject-setting-panel">
      <span className="inject-setting-panel-title">
        设计器插件：
      </span>
      <span style={{ float: 'right' }}>
        <Button
          size="small"
          onClick={() => {
            props.injectConfig.clearAll();
            props.injectConfig.save();
            window.location.reload();
          }}
        >重置插件配置</Button>
      </span>
      <Table className="inject-setting-panel-table" dataSource={dataSource}>
        <Table.Column title="插件名字" htmlTitle="插件" dataIndex="pluginName" />
        <Table.Column title="调试注册视图" dataIndex="pluginName" cell={(pluginName, index, record) => (
          <>
            {
              options.map(resource => {
                if (resource.children) {
                  return (
                    <div>
                      <span className="inject-setting-panel-label">{ resource.label }</span>
                      {
                        resource.children.map(view => (
                          <Checkbox
                            checked={props.injectConfig.get(pluginName, resource.value, view.value)}
                            onChange={(checked: boolean) => {
                              props.updateInjectConfig(record.pluginName, resource.value, view.value, checked);
                            }}
                          >
                            { view.label }
                          </Checkbox>
                        ))
                      }
                    </div>
                  )
                }
                return (
                  <div>
                    <span className="inject-setting-panel-label">{ resource.label }</span>
                    <Checkbox
                      checked={props.injectConfig.get(pluginName, resource.value)}
                      onChange={(checked: boolean) => {
                        props.updateInjectConfig(record.pluginName, resource.value, '', checked);
                      }}
                    >
                    </Checkbox>
                  </div>
                )
              })
            }
          </>
        )} />
      </Table>
      <InjectItem
        title="Setter"
        injectItems={injectedSetters}
      />
    </div>
  )
}

function InjectItem(props: {
  title: string,
  injectItems: {
    name: string;
  }[]
}) {
  if (!props.injectItems || !props.injectItems.length) {
    return null;
  }

  return (
    <div>
      <span className="inject-setting-panel-title">{props.title}：</span>
      <div className="inject-setting-panel-inject-item">
        {props.injectItems && props.injectItems.map((item) => (
          <span>{item.name}</span>
        ))}
      </div>
    </div>
  )
}