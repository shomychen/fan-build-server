import { fetchNpmClient } from '@/services/common';
import { getTerminalRefIns } from '@/utils/terminal.js'
import { callRemote, listenRemote } from '@/socket';
import { queryLogData } from '@/services/log';

const getTaskDetail = async (taskType, log = true, dbPath = '', key,) =>
  await callRemote({
    type: 'tasks/detail',
    key,
    payload: {
      type: taskType,
      log,
      dbPath
    },
  });

let init = false;
export default {
  namespace: 'task',
  state: {
    npmClients: [],
    listenTaskResult: {},
    taskState: {},
    taskLogData: [], // 当前项目的操作日志
  },
  subscriptions: {
    setup({ history, dispatch }) {
      history.listen(({ pathname, query }) => {

        if (init) {
          return;
        }
        console.log(pathname, query)
        if (pathname === '/task') {
          init = true;
          // 接收状态通知
          // 日志更新
          console.log('日志更新， 监听')
          listenRemote({
            type: '@@log/message',
            onMessage: ({
                          date,
                          message,
                          type,
                        }) => {
              console.log('监听 @@log/message', date,
                message,
                type)
              // if (!log) {
              //   return;
              // }
              dispatch({
                type: 'writeLog',
                payload: {
                  // taskType,
                  // log,
                  // key,
                },
              });
            },
          });
        }
      })
    }
  },
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
    },
    *fetch_task_logData({ payload, callback }, { call, put }){
      const response = yield call(queryLogData, payload); //
      if (response.code === 200) {
        yield put({
          type: 'saveTaskLogData',
          payload: response.data || [],
        });
      }
      if (callback) callback(response);
    },
    // 获取任务详情（获取日志时使用 -> 前端不做 log 的存储）
    *getTaskDetail({ payload }, { put, call }) {
      console.log('getTaskDetail==》 获取任务详情（获取日志时使用 -> 前端不做 log 的存储）')
      try {
        const { taskType, callback, log, dbPath, key } = payload;
        const result = yield call(getTaskDetail, taskType, log, dbPath, key);
        console.log('更新当前执行的任务进度', result)
        callback && callback(result);
      }
      catch (e) {
        console.log('更新当前执行的任务进度报错', e)
      }
      // yield put({
      //   type: 'updateWebpackStats',
      //   payload: result,
      // });
    },

    // 更新日志
    *writeLog({ payload }, { select }) {
      const { taskType, log, key: projectKey } = payload;
      const modal = yield select(state => state.task);
      const key = modal && modal.listenTaskResult && modal.listenTaskResult.projectId;
      if (!key) {
        return;
      }
      const ins = getTerminalRefIns(taskType, projectKey);
      if (!ins) {
        return;
      }
      console.log('更新日志writeLog', log)
      ins.write(log.replace(/\n/g, '\r\n'));
    },
  },
  reducers: {
    saveNpmClients(state, { payload }) {
      return {
        ...state,
        npmClients: payload,
      };
    },
    // 更新任务执行进度
    updateRunTaskResult(state, { payload }) {
      return {
        ...state,
        listenTaskResult: payload,
      };
    },

    saveTaskLogData(state, { payload }) {
      return {
        ...state,
        taskLogData: payload,
      };
    },
  },
};
