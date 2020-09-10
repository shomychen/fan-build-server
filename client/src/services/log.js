
import request from '@/utils/request';
// 获取操作日志相关接口
const baseUrl = `/api/log`;
// 查询
export async function queryLogData(params) {
  return request(`${baseUrl}/page`, {
    method: 'GET',
    params,
  })
}

// 新增
export async function saveLog(params) {
  return request(`${baseUrl}/save`, {
    method: 'POST',
    data: params,
  })
}

// 修改
export async function updateLog(params) {
  return request(`${baseUrl}/update`, {
    method: 'POST',
    data: params,
  })
}
