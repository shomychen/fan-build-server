import createDebug from 'debug';

export enum DEBUG {
  UmiUI = 'umiui',
  FanBuildUI = 'FanBuildUi',
  BaseUI = 'BaseUI',
  UIPlugin = 'UIPlugin',
}

const uiDebug = createDebug(DEBUG.FanBuildUI);

export const pluginDebug = uiDebug.extend(DEBUG.UIPlugin);

export default uiDebug.extend(DEBUG.BaseUI);
