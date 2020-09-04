import { queryProjectData, queryProjectById, saveProject, updateProject, deleteProject, queryTaskProgress } from '@/services/project';
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
    // 查询项目详情信息(单个项目信息）
    *fetch_projectInfo({ payload, callback }, { call, put }) {
      const response = yield call(queryProjectById, payload);
      yield put({
        type: 'saveProjectInfo',
        payload: response.data || {},
      });
      if (callback) callback(response);
    },
    // 创建项目信息
    *create_project({ payload, callback }, { call, put }) {
      const response = yield call(saveProject, payload);
      responseControl('create', response, callback)
    },
    // 删除项目信息
    *delete_project({ payload, callback }, { call }) {
      const response = yield call(deleteProject, payload);
      responseControl('delete', response, callback)
    },
    // 修改项目信息
    *update_project({ payload, callback }, { call, put }) {
      const response = yield call(updateProject, payload);
      responseControl('update', response, callback)
    },
    *update_project_task({ payload, callback }, { call, put }) {
      const response = yield call(queryTaskProgress, payload);
      if (callback) callback(response);
    }
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
