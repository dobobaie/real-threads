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
    const child = await nthread.load(__dirname + "/file_import.js");
    
    child.response(content => {
      console.log('[root] - message read from child : "', content, '"');
    });
    // ---

    nthread.getByGuuid(child.getGuuid()).send("Hey Child, how are you?");

    // nthread.close();
  });
