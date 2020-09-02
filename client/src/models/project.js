import { fetchNpmClient } from '@/services/common';

export default {
  namespace: 'project',
  state: {
    npmClients: []
  },
  subscriptions: {},
  effects: {
    // 获取当前系统已有的node客户端
    *fetch_npm_clients({ payload, callback }, { call, put }) {
      const response = yield call(fetchNpmClient, payload); //
      if (response.code === 200) {
        yield put({
          type: 'saveNpmClients',
          payload: response.data || [],
        });
      }
      if (callback) callback(response);
    }

  },
  reducers: {
    saveNpmClients(state, { payload }) {
      return {
        ...state,
        npmClients: payload,
      };
    },
  },
};
