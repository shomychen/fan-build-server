import { queryProjectData, queryProjectById, saveProject, updateProject, deleteProject } from '@/services/project';
import { responseControl } from '@/utils/response';

export default {
  namespace: 'project',
  state: {
    projectData: [], // 项目列表数据
    projectCurrentInfo: {} // 当前项目详情
  },
  subscriptions: {},
  effects: {
    // 获取项目列表
    *fetch_projectData({ payload, callback }, { call, put }) {
      const response = yield call(queryProjectData, payload); //
      if (response.code === 200) {
        yield put({
          type: 'saveProjectData',
          payload: response.data || [],
        });
      }
      if (callback) callback(response);
    },
    // 查询菜单详情信息(单个菜单信息）
    *fetch_projectInfo({ payload, callback }, { call, put }) {
      const response = yield call(queryProjectById, payload);
      yield put({
        type: 'saveProjectInfo',
        payload: response.data || {},
      });
      if (callback) callback(response);
    },
    // 创建菜单信息
    *create_project({ payload, callback }, { call, put }) {
      const response = yield call(saveProject, payload);
      responseControl('create', response, callback)
    },
    // 删除菜单信息
    *delete_project({ payload, callback }, { call }) {
      const response = yield call(deleteProject, payload);
      responseControl('delete', response, callback)
    },
    // 修改菜单信息
    *update_project({ payload, callback }, { call, put }) {
      const response = yield call(updateProject, payload);
      responseControl('update', response, callback)
    },
  },
  reducers: {
    saveProjectData(state, { payload }) {
      return {
        ...state,
        projectData: payload,
      };
    },
    saveProjectInfo(state, { payload }) {
      return {
        ...state,
        projectCurrentInfo: payload,
      };
    },
  },
};
