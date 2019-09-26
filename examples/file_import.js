thread => {
  thread.log('[child] - Child is now connected with PID: ' + thread.getPid());

  thread.response(content => {
    thread.log('[child] - message read from thread : "', content, '"');
  });

  thread.send("Hello I'm Child =)");
}
