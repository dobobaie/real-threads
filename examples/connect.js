/*
  unavailable: It is a good idea to do?
*/

const { Child } = require('../lib/index');

const child = new Child({ debug: true });
child.connect("http://127.0.0.1:3000").then(async thread => {
  thread.log('[child] - is now connected with PID: ' + thread.getPid());
  
  thread.response(content => {
    console.log("[child] - response", content);
    content === "Hello" ? thread.emit('Hi back !') : thread.emit('Fine and you?');
  });
});

