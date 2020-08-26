/**
 * request 网络请求工具
 * 更详细的 api 文档: https://github.com/umijs/umi-request
 */
import { extend } from 'umi-request';
import { notification, message } from 'antd';
// import router from 'umi/router';
// import { stringify } from 'qs';
const codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求不存在。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};
//
// // 功能状态码返回，即接口返回的 code 字段数据
// const apiCodeMessage = {
//   200: '请求XXX成功', // ok
//   400: '请求XXX失败', // bad_request
//   401: '未登录', // unauthorized 需要跳转到登录页
//   403: '未授权', // forbidden 需要跳转到登录页
//   404: '未找到', // not_found需要跳转到登录页
//   405: '不允许访问', // method_not_allowed 需要跳转到登录页
//   500: '未找到', // internal_server_error 服务器连接异常
// }
/**
 * 异常处理程序
 */

const errorHandler = error => {
  const { response } = error;
  if (response && response.status) {
    const errorText = codeMessage[response.status] || response.statusText;
    const { status, url } = response;
    // console.log('SC.response', response)
    // console.log('状态码', status, 'errorHandler == > 请求错误：', response);
/*    if (status === 401 || status === 25 || status === 26 || status === 27) {
      notification.error({
        message: '未登录或登录已过期，请重新登录。',
      });
      // @HACK
      /!* eslint-disable no-underscore-dangle *!/
      window.g_app._store.dispatch({
        type: 'login/logout',
      });
      return;
    } */
    notification.error({
      message: `请求错误 ${status}: ${url.slice(url.indexOf('/web'))}`,
      description: errorText,
    });
    // if (status <= 504 && status >= 500) {
    //   router.push('/exceptionPage/500');
    //   // return;
    // }
  }

  return response;
};
/**
 * 配置request请求时的默认参数
 */
const request = extend({
  errorHandler,
  // 默认错误处理
  credentials: 'include', // 默认请求是否带上cookie
  // requestType: 'form', // post请求时数据类型,声明formDat格式
  responseType: 'json',
  // prefix: '/spms-ibms-api', // 接口添加前缀
  headers: {
    // "Access-Control-Allow-Origin": "*",
    // Accept: 'application/json',
    // 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
  },
});


// request拦截器, 改变url 或 options. 参考 https://blog.csdn.net/weixin_41753520/article/details/98317567
request.interceptors.request.use((url, options) => {
  // 如Build_PATH=spms-ibms-web ==>>> /spms-ibms-api str.substring(0,str.lastIndexOf('-api'))
  const buildPath = process.env.baseBuildPath
  let urlPrefix = buildPath ? `/${buildPath.replace('-web', '-api')}` : '';
  const headers = Object.assign({
    ...options.headers,
  }, {
    'token': localStorage.getItem(`${process.env.siteName}-token`), // => siteAuth-token
  });
  return (
    {
      url: `${process.env.NODE_ENV === 'production' ? urlPrefix : ''}${url}`, // 生产环境下，接口请求添加前缀 [IBMS: /spms-ibms-api],[旅游平台：/spms-trip-api]
      options: { ...options, headers },
    }
  );
});
// response拦截器, 处理response
// 请求状态码200成功时，后台返回的 status 25,26,27时需要退出登录
/**
 * 5. 对于状态码实际是 200 的错误
 */
request.interceptors.response.use(async (response) => {
  // 对导出文件之类的接口做特殊处理，如果统一走下面json格式化处理，会使得下载的文件打开异常
  if (response.url.includes('exportQRCode') || response.url.includes('exportPatrolQRCode') || response.url.includes('controlVideoCaptureFrame') ||
    (response.url.substr(-7, 7) === '/export' || response.url.substring(0, response.url.lastIndexOf('?')).substr(-7, 7) === '/export')) {
    return response;
  } else {
    if (response.status === 200) {
      const data = await response.clone().json();
/*      if (data.code === 401) {
        if (window.g_app._store && !window.g_app._store.getState().login.isLoseToken) {
          // 判断只提示一个token失效
          window.g_app._store.dispatch({
            type: 'login/setIsLoseToken',
            payload: true,
          });
          message.error(data.msg); // 使用接口返回信息
        }
        // window.g_app._store.getState().login.isLoseToken
        window.g_app._store && window.g_app._store.dispatch({
          type: 'login/logout'
        });
      } else if (data.code !== 200) {
        message.error(data.msg);
      }*/
      if (data.code !== 200) {
        message.error(data.msg);
      }
    }
    return response;
  }
});

export default request;
