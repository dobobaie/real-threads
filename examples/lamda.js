const { Parent } = require('../lib/index');

const parent = new Parent({ debug: true });
parent.listen(3000).then(async nthread => {

  console.log("[root] - Server connected");
  console.log("[root] - public uri", nthread.getPublicUri());
  console.log("[root] - local uri", nthread.getLocalUri());

  const child = await nthread.create(thread => {
    thread.log('[child] - is now connected with PID: ' + thread.getPid());
    
    thread.response(content => {
      console.log("[child] - response", content);
      content === "Hello" ? thread.emit('Hi back !') : thread.emit('Fine and you?');
    });
  });

  child.emit('Hello');

  child.response(content => {
    console.log("[root] - response", content)
    content === "Hi back !" ? child.emit('How are you ?') : null;
  });
});
