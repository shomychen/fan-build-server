import { Row, Col, Spin, Tooltip, Popconfirm } from 'antd';
import { DeleteOutlined, VerticalAlignBottomOutlined } from '@ant-design/icons';
import { Terminal as XTerminal, ITerminalOptions } from 'xterm';
import cls from 'classnames';
import debounce from 'lodash/debounce';
import React, { ReactNode, useRef, useEffect, useState, forwardRef } from 'react';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { FitAddon } from 'xterm-addon-fit';
import styles from './index.less';
import SockJS from 'sockjs-client';// 推送监听
import { AttachAddon } from 'xterm-addon-attach';

const {Terminal} = window;

export type TerminalType = XTerminal;

interface ITerminalProps {
  /** Terminal title */
  title?: ReactNode;
  className?: string;
  terminalClassName?: string;
  /** defaultValue in Terminal */
  defaultValue?: string;
  /** terminal init event */
  onInit?: (ins: XTerminal, fitAddon: any) => void;
  /** https://xtermjs.org/docs/api/terminal/interfaces/iterminaloptions/ */
  config?: ITerminalOptions;
  onResize?: (ins: XTerminal) => void;
  /** terminal close */
  onClose?: () => void;

  [key: string]: any;
}

let socket: any;

const TerminalComponent: React.FC<ITerminalProps> = forwardRef((props = {}, ref) => {
  const fitAddon = new FitAddon();
  const domContainer = useRef<HTMLDivElement>(ref || null);
  const {
    title,
    className,
    defaultValue,
    onInit,
    config = {},
    terminalClassName,
    onResize = () => {
    },
    onClose = () => {
    },
    // default use true
    visible = true,
    toolbar = true,
  } = props;
  const [xterm, setXterm] = useState<XTerminal>(null);

  useEffect(() => {
    const terminalOpts: ITerminalOptions = {
      allowTransparency: true,
      fontFamily: 'operator mono,SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace',
      fontSize: 14,
      theme: {
        background: '#15171C',
        foreground: '#ffffff73',
      },
      cursorStyle: 'underline',
      cursorBlink: false,  //光标闪烁
      disableStdin: false, //是否应禁用输入。
      ...(config || {}),
    };
    const terminal = new Terminal(terminalOpts);
    setXterm(terminal);

    // return ()=> {
    //   xterm.dispose()
    // }
  }, []);

  const copyShortcut = (e: KeyboardEvent): boolean => {
    // Ctrl + Shift + C
    if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
      e.preventDefault();
      document.execCommand('copy');
      return false;
    }
    return true;
  };

  const closeShortcut = (e: KeyboardEvent): boolean => {
    // Ctrl + D
    if (e.ctrlKey && e.keyCode === 68) {
      e.preventDefault();
      onClose();
      return false;
    }
    return true;
  };

  useEffect(() => {
    const handleTerminalInit = async () => {
      if (domContainer.current && xterm) {
        const webLinksAddon = new WebLinksAddon();
        xterm.loadAddon(fitAddon);
        xterm.loadAddon(webLinksAddon);
        xterm.attachCustomKeyEventHandler(copyShortcut);
        xterm.attachCustomKeyEventHandler(closeShortcut);
        // last open
        xterm.open(domContainer.current);
        fitAddon.fit();
        if (onInit) {
          onInit(xterm, fitAddon);
        }
      }
    };
    handleTerminalInit();
  }, [domContainer, xterm]);

  useEffect(() => {
    const hanldeResizeTerminal = debounce(() => {
      fitAddon.fit();
      onResize?.(xterm);
      xterm?.focus?.();
    }, 380);
    if (visible) {
      window.addEventListener('resize', hanldeResizeTerminal);
    }
    return () => {
      window.removeEventListener('resize', hanldeResizeTerminal);
    };
  }, [xterm, visible]);

  useEffect(() => {
    if (defaultValue) {
      xterm?.write?.(defaultValue.replace(/\n/g, '\r\n'));
    }
  }, [xterm, defaultValue]);

  const clear = () => {
    xterm?.clear?.();
  };

  const toBottom = () => {
    xterm?.scrollToBottom?.();
  };

  const wrapperCls = cls(
    styles.wrapper,
    {
      [styles.toolbar]: !!toolbar,
    },
    className,
  );
  const terminalCls = cls(styles.logContainer, terminalClassName);

  return (
    <div className={wrapperCls}>
      {xterm ? (
        <>
          {toolbar && (
            <Row className={styles.titleWrapper}>
              <Col span={8} className={styles.formmatGroup}>
                {title || '日志'}
              </Col>
              <Col span={4} offset={12} className={styles.actionGroup}>
                <span className={styles.icon}>
                  <Popconfirm
                    title={'是否清空日志？'}
                    onConfirm={clear}
                  >
                    <Tooltip title={'清空日志'}>
                      <DeleteOutlined />
                    </Tooltip>
                  </Popconfirm>
                </span>
                <span className={styles.icon}>
                  <Tooltip title={'至底部'}>
                    <VerticalAlignBottomOutlined onClick={toBottom} />
                  </Tooltip>
                </span>
              </Col>
            </Row>
          )}
        </>
      ) : (
        <div style={{textAlign: 'center'}}>
          <Spin size="small" />
        </div>
      )}
      <div ref={domContainer} className={terminalCls} />
    </div>
  );
});

export default TerminalComponent;
