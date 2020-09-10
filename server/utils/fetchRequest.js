const fetch = require('node-fetch');

const basicUrl = 'http://127.0.0.1:4000'

function requestFetch (url, method, body){
  return new Promise(function (resolve, reject) {
    try {
      let searchParam = ''
      if (method === 'GET' && body) {
        searchParam = `?`
        Object.keys(body).forEach((key, index) => {
          searchParam += `${index === 0 ? '&' : ''}${key}=${body[key]}`
        })
      }
      fetch(`${basicUrl}${url}${searchParam}`, {
        method: method,
        body: method === 'GET' ? null : JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      })
        .then(res => res.json())
        .then(json => resolve(json));
    } catch (e) {
      reject(e)
    }
  });
}

module.exports = requestFetch
