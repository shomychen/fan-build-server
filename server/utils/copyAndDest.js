/**
 * 复制目录中的所有文件包括子目录
 * @param{ String }  src需要复制的目录
 * @param{ String }  dst复制到指定的目录
 * */
const fs = require('fs')
const stat = fs.stat;

const copyFiles = function (src, dst) {
  return new Promise(((resolve, reject) => {
// 读取目录中的所有文件/目录
    console.log('读取指定部署目录的所有文件', src)
    fs.readdir(src, function (err, paths, callback) {
      if (err) {
        reject(err);
        return
      }
     console.log('读取到的', paths)
      paths.forEach(function (path) {
        const _src = src + '/' + path
        const _dst = dst + '/' + path
        let readable;
        let writable;
        stat(_src, function (err, st) {
          if (err) {
            reject(err);
            return
          }
          // 判断是否为文件
          if (st && st.isFile()) {
            // 创建读取流
            readable = fs.createReadStream(_src);
            // 创建写入流
            writable = fs.createWriteStream(_dst);
            // 通过管道来传输流
            readable.pipe(writable);
            resolve()
          }
          // 如果是目录则递归调用自身
          else if (st && st.isDirectory()) {
            existToDest(_src, _dst, copyFiles);
          }
        });
      });
    });
  }))
};
// 在复制目录前需要判断该目录是否存在，不存在需要先创建目录
const existToDest = function (src, dst, callback) {
  return new Promise((resolve, reject)=> {
    fs.stat(dst, function (err, stats) {
      // 文件夹是否已存在
      console.log('判断目标目录是否存在', dst)
      if (stats && stats.isDirectory()) {
        callback(src, dst).then(()=> {
          console.log('已存在目标目录拷贝成功结果')
          resolve()
        }).catch((e)=> {
          reject(e)
        });
      }
      // 不存在
      else {
        fs.mkdir(dst, function () {
          callback(src, dst).then(()=> {
            console.log('不存在目标目录拷贝成功结果')
            resolve()
          }).catch((e)=> {
            reject(e)
          });
        });
      }
    });
  })
};

exports.copyFiles = copyFiles;
exports.existToDest = existToDest;
