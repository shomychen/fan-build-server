import request from '@/utils/request';
// 测试接口
export async function callTest(params) {
  return request('/api/test/page', {
    method: 'GET',
    params,
  });
}
