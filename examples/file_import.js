module.exports = thread => {
  thread.log('[child] - is now connected with PID: ' + thread.getPid());
  
  thread.response(content => {
    console.log("[child] - response", content);
    content === "Hello" ? thread.emit('Hi back !') : thread.emit('Fine and you?');
  });
};
