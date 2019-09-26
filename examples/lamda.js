const { listen } = require('../index');

console.log("[root] - Run listen");

listen(3000, { debug: false })
  .then(async nthread => {
    console.log("[root] - Server connected");
    console.log("[root] - public uri", nthread.getPublicUri());
    console.log("[root] - local uri", nthread.getLocalUri());

    nthread.response(data => {
      console.log('[root] - message read from nthread : "', data.content, '" by "', data.guuid, '"');
      nthread.getByGuuid(data.guuid).send("Welcome from root =)");
    });

    // ---
    const child = await nthread.create(thread => {
      thread.log('[child] - Child is now connected with PID: ' + thread.getPid());

      thread.response(content => {
        thread.log('[child] - message read from thread : "', content, '"');
      });

      thread.send("Hello I'm Child =)");
    });
    
    child.response(content => {
      console.log('[root] - message read from child : "', content, '"');
    });
    // ---

    nthread.getByGuuid(child.getGuuid()).send("Hey Child, how are you?");

    // nthread.close();
  });
