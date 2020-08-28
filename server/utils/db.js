// db.js
const mongoose = require('mongoose');
const config = require('../config.json');

// 连接数据库源
let connectString = `mongodb://${config.db.servername}:${config.db.port}/${config.db.DATABASE}`;
let options = {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true};

mongoose.connect(connectString,options)

mongoose.connection.on('connected',function() {
  console.log('数据库连接成功，Mongoose connection open to '+connectString);
});
/**
 * 连接异常 error 数据库连接错误
 */
mongoose.connection.on('error',function(err) {
  console.log('连接异常，Mongoose connection error: '+ err);
});
/**
 * 连接断开 disconnected 连接异常断开
 */
mongoose.connection.on('disconnected',function() {
  console.log('连接断开，Mongoose connection disconnected');
});

module.exports = mongoose
