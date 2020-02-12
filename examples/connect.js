const { Child } = require('../lib/index');

const child = new Child({ debug: true });
child.connect("http://127.0.0.1:3000").then(async thread => {
  thread.log('[child] - is now connected with PID: ' + thread.getPid());
  
  thread.emit('Hi back !');

  thread.response(content => {
    console.log("[child] - response", content);
    content === "How are you ?" ? thread.emit('Fine and you?') : null;
  });
});

