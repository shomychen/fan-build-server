const fetch = require('node-fetch');

const basicUrl = 'http://127.0.0.1:4000'
async function request(url, method, body) {
  let searchParam = ''
  if (method === 'GET' && body) {
    searchParam = `?`
    Object.keys(body).forEach((key, index)=> {
      searchParam +=`${index === 0 ? '&': ''}${key}=${body[key]}`
    })
  }
  const response = await fetch(`${basicUrl}${url}${searchParam}`, {
    method: method,
    body: method === 'GET' ? null : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  });
  const json = await response.json();
  return json
}
module.exports = request
