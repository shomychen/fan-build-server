
import request from '@/utils/request';
// 获取项目相关接口

const baseUrl = `/api/project`;
// 查询
export async function queryProjectData(params) {
  return request(`${baseUrl}/page`, {
    method: 'GET',
    params,
  })
}

// 新增
export async function saveProject(params) {
  return request(`${baseUrl}/save`, {
    method: 'POST',
    data: params,
  })
}

// 删除
export async function deleteProject(params) {
  return request(`${baseUrl}/delete`, {
    method: 'POST',
    data: params,
  })
}

// 修改
export async function updateProject(params) {
  return request(`${baseUrl}/update`, {
    method: 'POST',
    data: params,
  })
}

// 详情
export async function queryProjectById(params) {
  return request(`${baseUrl}/detail`, {
    method: 'GET',
    params,
  })
}
