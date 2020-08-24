const mongoose = require('mongoose')
/**
 * test(tests) Model
 *  测试
 */
let testSchma = new mongoose.Schema({
  username: String,
  password: String,
  age: Number,
  address: String
})
const  testModel = mongoose.model('Test', testSchma)
module.exports = testModel
