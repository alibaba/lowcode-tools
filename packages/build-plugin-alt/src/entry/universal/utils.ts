import { material, project } from '@alilc/lowcode-engine';
import { Message } from '@alifd/next';
export const SAVE_KEY = `projectSchema_${PACKAGE_NAME}`;
console.log(SAVE_KEY);

export const preview = () => {
  saveSchema();
  setTimeout(() => {
    window.open('./preview.html');
  }, 500);
};

export const saveSchema = () => {
  window.localStorage.setItem(
    SAVE_KEY,
    JSON.stringify(project.exportSchema())
  );
  const packages = material.getAssets().packages;
  window.localStorage.setItem(
    'packages',
    JSON.stringify(packages)
  );
  Message.success('成功保存到本地');
};

export const resetSchema = async () => {
  const projectSchema = JSON.parse(
    window.localStorage.getItem(SAVE_KEY) || `{
      "componentName": "Page"
    }`
  );
  projectSchema.componentsTree = [{
    componentName: 'Page'
  }];

  window.localStorage.setItem(
    SAVE_KEY,
    JSON.stringify(projectSchema)
  );
  project.getCurrentDocument()?.importSchema({
    componentName: 'Page',
    fileName: 'sample',
  });
  Message.success('成功重置页面');
}

export const getPageSchema = async (type) => {
  const schema = JSON.parse(
    window.localStorage.getItem(SAVE_KEY) || '{}'
  );

  const pageSchema = schema?.componentsTree?.[0];

  if (pageSchema) {
    return pageSchema;
  }
  const initialSchema =  await request('./schema.json');
  if (type === 'setter') {
    initialSchema.children.push({
      "componentName": "BuiltInComp",
    })
  }
  return initialSchema;
};

function request(
  dataAPI: string,
  method = 'GET',
  data?: object | string,
  headers?: object,
  otherProps?: any,
): Promise<any> {
  return new Promise((resolve, reject): void => {
    if (otherProps && otherProps.timeout) {
      setTimeout((): void => {
        reject(new Error('timeout'));
      }, otherProps.timeout);
    }
    fetch(dataAPI, {
      method,
      credentials: 'include',
      headers,
      body: data,
      ...otherProps,
    })
      .then((response: Response): any => {
        switch (response.status) {
          case 200:
          case 201:
          case 202:
            return response.json();
          case 204:
            if (method === 'DELETE') {
              return {
                success: true,
              };
            } else {
              return {
                __success: false,
                code: response.status,
              };
            }
          case 400:
          case 401:
          case 403:
          case 404:
          case 406:
          case 410:
          case 422:
          case 500:
            return response
              .json()
              .then((res: object): any => {
                return {
                  __success: false,
                  code: response.status,
                  data: res,
                };
              })
              .catch((): object => {
                return {
                  __success: false,
                  code: response.status,
                };
              });
          default:
            return null;
        }
      })
      .then((json: any): void => {
        if (json && json.__success !== false) {
          resolve(json);
        } else {
          delete json.__success;
          reject(json);
        }
      })
      .catch((err: Error): void => {
        reject(err);
      });
  });
}