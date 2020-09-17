const fs = require('fs-extra');
const path = require('path');
const tools = require('./tools.js');
const sha1 = require('sha1'); // 密码加密
const iconv = require('iconv-lite'); // 转换控制台乱码
// const logModel = require('../models/log.js');
// const projectModel = require('../models/project.js');
// const interfaceColModel = require('../models/interfaceCol.js');
// const interfaceCaseModel = require('../models/interfaceCase.js');
// const interfaceModel = require('../models/interface.js');
// const userModel = require('../models/user.js');
// const followModel = require('../models/follow.js');
// const json5 = require('json5');
// const _ = require('underscore');
// const Ajv = require('ajv');
//
// const ejs = require('easy-json-schema');
//
// const jsf = require('json-schema-faker');
// const http = require('http');


/*
* @desc 接口返回值
*
* @params {any} data 返回数据
* @param {Number} num 返回状态值
* @params {string} errmsg 返回提示语
* */
exports.resReturn = (data, codeNum, errmsg, ...other) => {
  codeNum = codeNum || 0;

  return {
    code: codeNum,
    msg: errmsg || '操作成功！',
    data: data,
    ...other
  };
};

// 封装控件台打印信息
exports.log = (msg, type) => {
  if (!msg) {
    return;
  }

  type = type || 'log';

  let f;

  switch (type) {
    case 'log':
      f = console.log; // eslint-disable-line
      break;
    case 'warn':
      f = console.warn; // eslint-disable-line
      break;
    case 'error':
      f = console.error; // eslint-disable-line
      break;
    default:
      f = console.log; // eslint-disable-line
      break;
  }

  f(type + ':', msg);

  let date = new Date();
  let year = date.getFullYear();
  let month = date.getMonth() + 1;

  let logfile = path.join(tools.WEBROOT_LOG, year + '-' + month + '.log');

  if (typeof msg === 'object') {
    if (msg instanceof Error) msg = msg.message;
    else msg = JSON.stringify(msg);
  }

  // let data = (new Date).toLocaleString() + '\t|\t' + type + '\t|\t' + msg + '\n';
  let data = `[ ${new Date().toLocaleString()} ] [ ${type} ] ${msg}\n`;

  // 创建文件（日志文件）
  fs.writeFileSync(logfile, data, {
    flag: 'a'
  });
};

exports.fileExist = filePath => {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
};

// 获取当前时间
exports.time = () => {
  return Date.parse(new Date()) / 1000;
};

/*
* @desc 对查询返回的数据进行过滤
*
* @params {Object} data  返回字段参数
* @params {array} field 需要返回的字段名
*
* */
exports.fieldSelect = (data, field) => {
  if (!data || !field || !Array.isArray(field)) {
    return null;
  }

  var arr = {};

  field.forEach(f => {
    typeof data[f] !== 'undefined' && (arr[f] = data[f]);
  });

  return arr;
};

exports.rand = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
};

// exports.json_parse = json => {
//   try {
//     return json5.parse(json);
//   } catch (e) {
//     return json;
//   }
// };

exports.randStr = () => {
  return Math.random()
    .toString(36)
    .substr(2);
};
exports.getIp = ctx => {
  let ip;
  try {
    ip = ctx.ip.match(/\d+.\d+.\d+.\d+/) ? ctx.ip.match(/\d+.\d+.\d+.\d+/)[0] : 'localhost';
  } catch (e) {
    ip = null;
  }
  return ip;
};

// 生成密码
exports.generatePassword = (password, passsalt) => {
  return sha1(password + sha1(passsalt));
};
// 时间转换
exports.expireDate = day => {
  let date = new Date();
  date.setTime(date.getTime() + day * 86400000);
  return date;
};

exports.validateSearchKeyword = keyword => {
  if (/^\*|\?|\+|\$|\^|\\|\.$/.test(keyword)) {
    return false;
  }

  return true;
};


/**
 * 验证一个 path 是否合法
 * path第一位必需为 /, path 只允许由 字母数字-/_:.{}= 组成
 */
exports.verifyPath = path => {
  // if (/^\/[a-zA-Z0-9\-\/_:!\.\{\}\=]*$/.test(path)) {
  //   return true;
  // } else {
  //   return false;
  // }
  return /^\/[a-zA-Z0-9\-\/_:!\.\{\}\=]*$/.test(path);
};

/**
 * 沙盒执行 js 代码
 * @sandbox Object context
 * @script String script
 * @return sandbox
 *
 * @example let a = sandbox({a: 1}, 'a=2')
 * a = {a: 2}
 */
exports.sandbox = (sandbox, script) => {
  try {
    const vm = require('vm');
    sandbox = sandbox || {};
    script = new vm.Script(script);
    const context = new vm.createContext(sandbox);
    script.runInContext(context, {
      timeout: 3000
    });
    return sandbox
  } catch (err) {
    throw err
  }
};

function trim(str) {
  if (!str) {
    return str;
  }

  str = str + '';

  return str.replace(/(^\s*)|(\s*$)/g, '');
}

function ltrim(str) {
  if (!str) {
    return str;
  }

  str = str + '';

  return str.replace(/(^\s*)/g, '');
}

function rtrim(str) {
  if (!str) {
    return str;
  }

  str = str + '';

  return str.replace(/(\s*$)/g, '');
}

exports.trim = trim;
exports.ltrim = ltrim;
exports.rtrim = rtrim;

/**
 * 处理请求参数类型，String 字符串去除两边空格，Number 使用parseInt 转换为数字
 * @params Object {a: ' ab ', b: ' 123 '}
 * @keys Object {a: 'string', b: 'number'}
 * @return Object {a: 'ab', b: 123}
 */
exports.handleParams = (params, keys) => {
  if (!params || typeof params !== 'object' || !keys || typeof keys !== 'object') {
    return false;
  }

  for (var key in keys) {
    var filter = keys[key];
    if (params[key]) {
      switch (filter) {
        case 'string':
          params[key] = trim(params[key] + '');
          break;
        case 'number':
          params[key] = !isNaN(params[key]) ? parseInt(params[key], 10) : 0;
          break;
        default:
          params[key] = trim(params + '');
      }
    }
  }

  return params;
};

/**
 *
 * @param {*} router router
 * @param {*} baseurl 前缀目录base_url_path
 * @param {*} routerController controller
 * @param {*} path  routerPath
 * @param {*} method request_method , post get put delete ...
 * @param {*} action controller 方法名
 * @param {*} ws enable ws
 *
 * @example
 */
exports.createAction = (router, baseurl, routerController, action, path, method, ws) => {
  router[method](baseurl + path, async ctx => {
    let inst = new routerController(ctx); // 创建实例
    try {
      await inst.init(ctx); // 初始化（执行controller/base内的init
      ctx.params = Object.assign({}, ctx.request.query, ctx.request.body, ctx.params); // 拼合query,body,还有params
      await inst[action].call(inst, ctx); // 执行controller内的方法，如controller/test.js内的 testGet()
  /*    // 判断 是否登录
      if (inst.$auth === true) {
        await inst[action].call(inst, ctx);
      } else {
        if (ws === true) {
          ctx.ws.send('请登录...');
        } else {
          ctx.body = tools.commons.resReturn(null, 40011, '请登录...');
        }
      } */
    } catch (err) {
      ctx.body = {
        code: 40011,
        msg: '服务出错',
        errorMsg: JSON.stringify(err)
      }
      console.log(err);
    }
  });
}

/*

exports.createWebAPIRequest = function (ops) {
  return new Promise(function (resolve, reject) {
    let req = '';
    let http_client = http.request(
      {
        host: ops.hostname,
        method: 'GET',
        port: ops.port,
        path: ops.path
      },
      function (res) {
        res.on('error', function (err) {
          reject(err);
        });
        res.setEncoding('utf8');
        if (res.statusCode != 200) {
          reject({ message: 'statusCode != 200' });
        } else {
          res.on('data', function (chunk) {
            req += chunk;
          });
          res.on('end', function () {
            resolve(req);
          });
        }
      }
    );
    http_client.on('error', (e) => {
      reject({ message: `request error: ${e.message}` });
    });
    http_client.end();
  });
}

*/
// 驼峰式转下横线：
exports.toLowerLine = (str) => {
  let temp = str.replace(/[A-Z]/g, function (match) {
    return "_" + match.toLowerCase();
  });
  if(temp.slice(0,1) === '_'){ //如果首字母是大写，执行replace时会多一个_，这里需要去掉
    temp = temp.slice(1);
  }
  return temp;
}

// 创建报错日志
exports.newError = (tips)=> {
  return new Error(`\x1b[31m${tips}\x1b[39m\n`).toString()
}


/*
 * 转换控制台显示乱码
 * @params {string} message 需要转换的文本
 * */
const encoding = 'cp936';
const binaryEncoding = 'binary';
exports.iconvDecode = (message)=> {
  return iconv.decode(Buffer.from(message, binaryEncoding), encoding)
}
