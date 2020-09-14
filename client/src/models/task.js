import { fetchNpmClient } from '@/services/common';
import { getTerminalRefIns } from '@/utils/terminal.js'
import { callRemote, listenRemote } from '@/socket';
import { queryLogData } from '@/services/log';

const getTaskLogHistory = async (taskType, log = true, dbPath = '', key,) => await callRemote({
  type: '@@tasks/log/history', // 获取任务进程历史记录详情，即以往的任务进程消息
  payload: {
    log,
    dbPath
  },
  key,
  taskType,
});


const clearTaskLog = async (taskType, key,) => await callRemote({
  type: '@@tasks/log/clear', // 获取任务进程历史记录详情，即以往的任务进程消息
  payload: {
  },
  key,
  taskType,
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
          console.log('操作日志更新， 监听')
          listenRemote({
            type: '@@log/message',
            onMessage: (payload) => {
              console.log('监听到操作日志更新 @@log/message', payload)
              dispatch({
                type: 'fetch_task_logData',
                payload: {
                  projectId: query.id
                },
              });
            },
          });
          listenRemote({
            type: '@@tasks/log/process',
            onMessage: ({ taskType, log, key, payload }) => {
              console.log('监听 @@tasks/log/process', taskType, log, key, payload)
              dispatch({
                type: 'writeLog',
                payload: {
                  taskType,
                  log,
                  key,
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
    *fetch_task_logData({ payload, callback }, { call, put }) {
      const response = yield call(queryLogData, payload); //
      if (response.code === 200) {
        yield put({
          type: 'saveTaskLogData',
          payload: response.data || [],
        });
      }
      if (callback) callback(response);
    },
    // 获取任务进程历史记录
    *get_tasksLogHistory({ payload }, { put, call }) {
      console.log('get_tasksLogHistory ==》 获取任务进程历史记录）', payload)
      try {
        const { taskType, callback, log, dbPath, key } = payload;
        const result = yield call(getTaskLogHistory, taskType, log, dbPath, key);
        console.log('获取任务进程历史记录返回值', result)
        callback && callback(result);
      }
      catch (e) {
        console.log('获取任务进程历史记录报错', e)
      }
      // yield put({
      //   type: 'updateWebpackStats',
      //   payload: result,
      // });
    },

    // 清空进程日志
    *clear_tasksLogHistory({ payload }, { put, call }) {
      console.log('clear_tasksLogHistory==》 清空进程日志历史记录）', payload)
      try {
        const { taskType, callback, key } = payload;
        const result = yield call(clearTaskLog, taskType, key);
        console.log('清空进程日志历史记录', result)
        callback && callback(result);
      }
      catch (e) {
        console.log('清空进程日志历史记录报错', e)
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
      let terminal = getTerminalRefIns(taskType, projectKey) // 任务类型为 INSTALL
      if (!terminal) {
        return;
      }
      console.log('更新日志writeLog',  log)
      terminal.write(`\r\n${log.replace(/\n/g, '\r\n')}`);
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
