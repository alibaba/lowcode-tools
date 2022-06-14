{{{ componentViewsImportStr }}}
{{{ componentViewsExportStr }}}

import * as componentInstances from '{{{entryPath}}}';

{{{scssImport}}}

export * from '{{{entryPath}}}';

const coveredComponents = {{{componentViews}}};

const library = '{{{ library }}}';
const execCompile = !!{{{ execCompile }}};

if (!execCompile) {
  window[library] = Object.assign({__esModule: true}, componentInstances || {}, coveredComponents || {});
}

function getRealComponent(component, componentName) {
  if (component.default) return component.default;
  if (component[componentName]) return component[componentName];
  return component;
}