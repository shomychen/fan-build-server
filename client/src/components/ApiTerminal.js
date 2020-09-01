// allowTransparency: true,
//   fontFamily: `operator mono,SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace`,
//   cursorBlink: false,
//   cursorStyle: 'underline',
//   disableStdin: true,
const Terminal = props => (
  <ApiTerminal
    config={{
      allowTransparency: true,
      fontFamily: `operator mono,SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace`,
      cursorBlink: false,
      cursorStyle: 'underline',
      disableStdin: true,
      ...(api.isMini() ? { fontSize: 12 } : {}),
    }}
    {...props}
  />
);
