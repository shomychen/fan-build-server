import request from '@/utils/request';
// 获取当前系统已有的node客户端
export async function fetchNpmClient(params) {
  return request('/api/ci/fetch/npmclient', {
    method: 'GET',
    params,
  });
}
