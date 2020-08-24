const mongoose = require('mongoose')
/**
 * Person Model
 * 用户信息
 */
let userSchma = new mongoose.Schema({
  username: String,
  password: String,
  age: Number,
  address: String
})
const  tableModel = mongoose.model('Table', userSchma)
module.exports = tableModel
