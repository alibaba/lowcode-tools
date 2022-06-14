{{#if isRax}}
const loadingStyle = {
  width: '100vw',
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 300,
  fontSize: '24px',
  lineHeight: '36px',
};
import { useState, render } from "rax";
import Renderer from "@ali/lowcode-rax-renderer";
import UniversalDriver from 'driver-universal';
const Loading = () => <div style={loadingStyle} className="lowcode-plugin-sample-preview-loading"> <h1>Loading...</h1> </div>;
{{else}}
import ReactDOM from 'react-dom';
import React, { useState } from 'react';
import { Loading } from '@alifd/next';
import Renderer from '@alilc/lowcode-react-renderer';
{{/if}}

import { buildComponents, assetBundle, AssetLevel, AssetLoader } from '@alilc/lowcode-utils';

const queryObject = new URLSearchParams(window.location.search);
const platform = queryObject.get('platform') || 'default';

const SamplePreview = () => {
  const [data, setData] = useState({});

  async function init() {
    const packages = JSON.parse(window.localStorage.getItem('packages'));
    const projectSchema = JSON.parse(window.localStorage.getItem('projectSchema'));
    const { componentsMap: componentsMapArray, componentsTree } = projectSchema;
    const componentsMap = {};
    componentsMapArray.forEach((component) => {
      componentsMap[component.componentName] = component;
    });
    const schema = componentsTree[0];

    const libraryMap = {};
    const libraryAsset = [];
    packages.forEach(({ package: _package, library, urls, renderUrls, advancedUrls }) => {
      libraryMap[_package] = library;
      if (advancedUrls && advancedUrls[platform]) {
        libraryAsset.push(advancedUrls[platform]);
      } else if (renderUrls) {
        libraryAsset.push(renderUrls);
      } else if (urls) {
        libraryAsset.push(urls);
      }
    });

    const vendors = [assetBundle(libraryAsset, AssetLevel.Library)];

    // TODO asset may cause pollution
    const assetLoader = new AssetLoader();
    try{
      await assetLoader.load(libraryAsset);
    } catch (e) {
      console.warn('[LowcodePreview] load resources failed: ', e);
    }
    const components = buildComponents(libraryMap, componentsMap);

    setData({
      schema,
      components,
    });
  }

  const { schema, components } = data;

  if (!schema || !components) {
    init();
    return <Loading fullScreen />;
  }

  return (
    <div className="lowcode-plugin-sample-preview">
      <Renderer
        className="lowcode-plugin-sample-preview-content"
        schema={schema}
        components={components}
      />
    </div>
  );
};

{{#if isRax}}
render(<SamplePreview />, document.getElementById('ice-container'), { driver: UniversalDriver });
{{else}}
ReactDOM.render(<SamplePreview />, document.getElementById('ice-container'));
{{/if}}
