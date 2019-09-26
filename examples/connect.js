const { connect } = require('../index');

console.log("[root] - Run connect");

connect("http://127.0.0.1:3000", { debug: false })
  .then(thread => {
    console.log("[root] - Client connected from " + thread.getGuuid());

    thread.response(content => {
      console.log('[root] - message read from thread : "', content, '"');
    });

    thread.send("Hello world =)");

    // thread.close();
  });
