const { pascalCase, camelCase } = require('change-case');
const antdStyle = /^antd\/.*(\/style|\.css|\.less|\.sass|\.scss)/;
const antdComp = /^antd\//;
const antdCompLowcase = ['message', 'notification', 'version'];
const nextStyle = /^\@alifd\/next\/.*(\.css|\.less|\.sass|\.scss)/;
const nextComp = /^\@alifd\/next\//;
const nextCompLowcase = [];
const momentLocal = /^moment\/locale/;
const lodash = /^lodash\//;
const externals = [
  {
    '@ant-design/icons': 'var window.icons',
    "echarts": "var window.echarts",
    "lodash": "var window._",
    moment: 'var window.moment'
  },
  function(ctx, req, cb) {
    if(lodash.test(req)) {
      let comp = req.split('/').pop();
      comp = `var window._.${comp}`
      console.info(comp);
      return cb(null, comp);
    }
    else if(momentLocal.test(req)) {
      return cb(null, '{}');
    }
    else if(antdStyle.test(req)) {
      return cb(null, 'var window.antd.styles');
    }
    else if(antdComp.test(req)) {
      if(req.indexOf('/locale/') >= 0) {
        return cb();
      }
      let comp = req.split('/').pop();
      if(antdCompLowcase.includes(comp)) {
        comp = camelCase(comp);
      }
      else {
        comp = pascalCase(comp);
      }
      comp = `var window.antd.${comp}`;
      console.info(comp);
      return cb(null, comp);
    }

    else if(nextStyle.test(req)) {
      return cb(null, 'var window.Next.styles');
    }
    else if(nextComp.test(req)) {
      if(req.indexOf('/locale/') >= 0) {
        return cb();
      }
      let comp = req.split('/').pop();
      if(nextCompLowcase.includes(comp)) {
        comp = camelCase(comp);
      }
      else {
        comp = pascalCase(comp);
      }
      comp = `var window.Next.${comp}`;
      console.info(comp);
      return cb(null, comp);
    }

    return cb();
  },
]

module.exports = externals;
