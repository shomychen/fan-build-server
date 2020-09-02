const TaskType = {
  BUILD: "BUILD", // 构建
  BUILDAndDEPLOY: "BUILDAndDEPLOY", // 构建及部署
  DEV: "DEV",
  PUSH: "PUSH", // 发布已打包的目录到SVN
  INSTALL: "INSTALL" // 安装依赖
}

const TERMINAL_MAPS = {};

/*
* @params {String} key  项目ID
* */
export const getTerminalRefIns = (taskType, key) => {
  if (!key || !taskType) {
    return null;
  }
  if (TERMINAL_MAPS[key]) {
    return TERMINAL_MAPS[key][taskType];
  }
};

export const setTerminalRefIns = (taskType, key, ins) => {
  TERMINAL_MAPS[key] = {
    [taskType]: ins
  };
};
