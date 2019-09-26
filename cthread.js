const io = require('socket.io-client');
const uuidv4 = require("uuid/v4");

const Eventm = require("eventm");
const eventm = new Eventm();

let Debug = enable => msg => (enable ? console.log(msg) : null);
const DebugExit = m => { Debug(m),process.exit() };

const CThread = function(socket, options) {
  eventm.create("cthread_msg", null, { keepSession: false });
  eventm.create("cthread_disconnect", null, { keepSession: false });

  this.getPid = () => process.pid;

  this.getGuuid = () => options.guuid;

  this.log = (...arguments) =>
    socket.emit('log', { content: arguments.join(' ') });

  this.send = content => socket.emit('msg', { content });

  this.response = cb => eventm.getEvent("cthread_msg").push(cb);
  
  this.on = (instruction, cb) => {
    switch (instruction) {
      case "disconnect":
        return eventm.getEvent("cthread_disconnect").push(cb);
      break;
    }
  };

  this.close = () => {
    socket.close();
  };

  process.on('exit', () => this.close());
  process.on('SIGINT', DebugExit);
  process.on('SIGUSR1', DebugExit);
  process.on('SIGUSR2', DebugExit);
  process.on('uncaughtException', DebugExit);

  return this;
}

const NThreadConnect = function(uri, options)
{
  options = options || {};
  options = {
    debug: options.debug || false,
    guuid: options.guuid || null
  };

  Debug = Debug(options.debug);
  Debug("[cthread] - Running NThreadConnect with guuid: " + options.guuid);

  const initConnection = (connection) => {
    const _engine = {
      connected: false,
      thread: null
    };
    
    Debug("[cthread] - Socket is trying to connect to : " + uri);
    const socket = io(uri, options.socket);

    socket.on('connect', () => {
      Debug("[cthread] - Socket client is connected");
      socket.emit('hello', {
        guuid: options.guuid
      });
    });
    
    socket.on('reconnect_error', () => {
      Debug("[cthread] - Socket client reconnect error");
      socket.close();
    });

    socket.on('reconnect_failed', () => {
      Debug("[cthread] - Socket client reconnect failed");
      socket.close();
    });

    socket.on('connect_failed', () => {
      Debug("[cthread] - Socket client connection failed");
      socket.close();
    });

    socket.on('connect_timeout', () => {
      Debug("[cthread] - Socket client connection timeout");
      socket.close();
    });

    socket.on('hello', data => {
      _engine.connected = true;
      _engine.thread = new CThread(socket, options);
      options.guuid = data.guuid;
      Debug("[cthread] - Socket client received 'hello' with guuid: " + options.guuid);
      eventm.getEvent("connection").resolve(_engine.thread);
      socket.emit("ready");
    });

    socket.on('msg', data => {
      Debug("[cthread] - Socket client received 'msg'");
      eventm.getEvent("cthread_msg").resolveForced(data.content)
    });

    socket.on('disconnect', () => {
      Debug("[cthread] - Socket client received 'disconnect'");
      if (!_engine.connected) {
        return eventm.getEvent("connection").reject("Server disconnected");
      }
      return eventm.getEvent("cthread_disconnect").resolve();
    });
  }

  const connection = eventm.create("connection", null, { promise: true });
  initConnection();
  return connection;
}

module.exports = NThreadConnect;

