const TaskType = {
  BUILD: "BUILD",
  DEV: "DEV",
  TEST: "TEST",
  LINT: "LINT",
  INSTALL: "INSTALL"
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
