const processExists = require("process-exists");
const tempDir = require("temp-dir");
const uuidv4 = require("uuid/v4");
const fs = require("fs");
const publicIp = require("public-ip");
const getPort = require("get-port");
const spawn = require("child_process").spawn;
const http = require("http");
const https = require("https");
const io = require("socket.io");

const Eventm = require("eventm");
const eventm = new Eventm();

const R = require;
let Debug = enable => msg => (enable ? console.log(msg) : null);
const DebugExit = m => { Debug(m),process.exit() };
  
const CThread = function(guuid, thread, options) {
  let client = null;

  this.getPid = () => thread ? thread.pid : undefined;

  this.getGuuid = () => guuid;

  this.send = content => client.emit("msg", { content });

  this.response = cb => eventm.getEvent(`thread_${guuid}_msg`).push(cb);

  this.on = (instruction, cb) => {
    switch (instruction) {
      case "*":
        return [
          eventm
            .getEvent(`thread_${guuid}_disconnect`)
            .push(data => cb(data, 'disconnect')),
          eventm
            .getEvent(`thread_${guuid}_process_stdout`)
            .push(data => cb(data, 'stdout')),
          eventm
            .getEvent(`thread_${guuid}_process_stderr`)
            .push(data => cb(data, 'stderr'))
        ];
        break;
      case "disconnect":
        return eventm
          .getEvent(`thread_${guuid}_disconnect`)
          .push(cb);
        break;
      case "stdout":
        return eventm
          .getEvent(`thread_${guuid}_process_stdout`)
          .push(cb);
        break;
      case "stderr":
        return eventm
          .getEvent(`thread_${guuid}_process_stderr`)
          .push(cb);
        break;
    }
  };

  this.close = () => {
    Debug(`[nthread] - closing "${guuid}" thread`);
    if (client) {
      client.disconnect();
    }
    if (fs.existsSync(`${options.tmpFolder}/${guuid}.js`)) {
      fs.unlinkSync(`${options.tmpFolder}/${guuid}.js`);
    }
    if (thread) {
      processExists(thread.pid).then(exists =>
        exists ? process.kill(thread.pid) : null
      );
    }
  };

  eventm
    .getEvent(`thread_${guuid}_disconnect`)
    .push(() => this.close());

  eventm
    .getEvent(`thread_${guuid}_process_close`)
    .push(() => this.close());

  return clt => {
    client = clt;
    return this;
  };
};

const CThreadCreate = function(guuid, thread_code, options) {
  const initTemporaryFile = () => {
    const location_file = `${options.tmpFolder}/${guuid}.js`;
    if (!fs.existsSync(options.tmpFolder)) {
      fs.mkdirSync(options.tmpFolder);
    }
    fs.writeFileSync(
      location_file,
      `require('${__dirname.replace(/\\/g, "/")}/cthread')("${
        options.local_uri
      }", {
        guuid: "${guuid}",
        debug: ${options.debug}
      }).then(${thread_code});`
    );
    return location_file;
  };

  const initThread = () => {
    const thread = spawn("node", [`${options.tmpFolder}/${guuid}.js`]);

    thread.stdout.on("data", data => {
      Debug(`[nthread] - thread "${guuid}" stdout => ${data.toString()}`);
      eventm
        .getEvent(`thread_${guuid}_process_stderr`)
        .resolveForced(data.toString());
    });

    thread.stderr.on("data", data => {
      Debug(`[nthread] - thread "${guuid}" stderr => ${data.toString()}`);
      eventm
        .getEvent(`thread_${guuid}_process_stderr`)
        .resolveForced(data.toString());
    });

    thread.on("exit", data => {
      Debug(`[nthread] - thread "${guuid}" exit => ${data.toString()}`);
      eventm
        .getEvent(`thread_${guuid}_process_exit`)
        .resolveForced(data.toString());
    });

    thread.on("close", () => {
      Debug(`[nthread] - thread "${guuid}" close`);
      eventm.getEvent(`thread_${guuid}_process_close`).resolveForced();
    });
    return thread;
  };

  initTemporaryFile();
  const thread = initThread();
  const cthread = new CThread(guuid, thread, options);
  
  return new Promise((resolve, reject) =>
    eventm.getEvent(`thread_${guuid}`)
      .getPromise()
      .then(client => resolve(cthread(client)))
      .catch(e => reject(e))
  );
};

const NThreadGenerateIdentity = () =>
{
  const guuid = uuidv4();
  eventm.create(`thread_${guuid}`);
  eventm.create(`thread_${guuid}_msg`, { keepSession: false });
  eventm.create(`thread_${guuid}_disconnect`, { keepSession: false });
  eventm.create(`thread_${guuid}_process_stdout`, { keepSession: false });
  eventm.create(`thread_${guuid}_process_stderr`, { keepSession: false });
  eventm.create(`thread_${guuid}_process_exit`, { keepSession: false });
  eventm.create(`thread_${guuid}_process_close`, { keepSession: false });
  return guuid;
};

const Nthread = function(server, socket, options) {
  eventm.create(`thread_msg`, { keepSession: false });

  const listThreads = [];
  
  this.getPublicUri = () => options.public_uri;

  this.getLocalUri = () => options.local_uri;

  this.getByGuuid = guuid =>
    listThreads.reduce((acc, cval) =>
      (cval.getGuuid() === guuid ? cval : acc)
    , null);

  this.send = data =>
    listThreads.map(thread =>
      thread.send(data)
    );

  this.response = cb => eventm.getEvent(`thread_msg`).push(cb);

  this.createFromIO = client => {
    const guuid = NThreadGenerateIdentity();
    const cthread = new CThread(guuid, null, options)(client);
    listThreads.push(cthread);
    return cthread;
  };

 this.create = thread_code => {
    const guuid = NThreadGenerateIdentity();
    return new CThreadCreate(guuid, thread_code, options)
      .then(cthread => {
        listThreads.push(cthread);
        return cthread;
      });
  };

  this.load = file => this.create(R(file));

  this.close = async () => {
    Debug(`[nthread] - closing all threads and server`);
    listThreads.map(thread => thread.close());
    // socket.close();
    server.close();
    server.isClose = true;
  };

  process.on('exit', () => this.close());
  process.on('SIGINT', DebugExit);
  process.on('SIGUSR1', DebugExit);
  process.on('SIGUSR2', DebugExit);
  process.on('uncaughtException', DebugExit);

  return this;
};

const NThreadListen = async function(port, options) {
  options = options || (typeof(port) === 'object' && port) || {};
  options = {
    local_ip: '127.0.0.1',
    debug: options.debug === true || false,
    tmpFolder: options.tmpFolder || `${tempDir}/nthread_generate2d`,
    protocol: options.secure === true ? "https://" : "http://",
    port: options.port || (typeof(port) !== 'object' && port) || undefined
  };

  Debug = Debug(options.debug);
  Debug("[nthread] - Running NThreadListen");

  let nthread = null;
  const initServer = async () => {
    const server = (options.protocol === "https://"
      ? https
      : http
    ).createServer(options.server);
    options.port = options.port || (await getPort().catch(err => 6666));
    options.public_ip = await publicIp.v4().catch(err => options.local_ip);
    options.public_uri = `${options.protocol}${options.public_ip}:${options.port}`;
    options.local_uri = `${options.protocol}${options.local_ip}:${options.port}`;
    server.listen(options.port, (err, data) => {
      if (err) {
        Debug("[nthread] - Server listen failed");
        return eventm.getEvent("listen").reject(err);
      }
      Debug("[nthread] - Server listen at : " + options.port);
      nthread = new Nthread(this.server, this.socket, options);
      return eventm.getEvent("listen").resolve(nthread);
    });
    return server;
  };

  const initSocket = async () => {
    const socket = io(this.server, options.socket);
    socket.on("connection", client => {
      let client_guuid = null;
      let client_event = null;
      Debug("[nthread] - Socket client new connection");

      client.on("hello", async data => {
        client_guuid = data.guuid;
        client_event = eventm.getEvent(`thread_${client_guuid}`);
        
        Debug("[nthread] - Socket client received 'hello' from " + client_guuid);
        if (!client_guuid || !client_event) {
          Debug(`[nthread] - Socket client new client detected. Creation of his prototype...`);
          const thread = await nthread.createFromIO(client);
          client_guuid = thread.getGuuid();
          client_event = eventm.getEvent(`thread_${client_guuid}`);
          Debug(`[nthread] - Socket client welcome to the new client "${client_guuid}"`);
        }
        client.emit("hello", {
          guuid: client_guuid
        });
      });

      client.on("ready", data => {
        if (!client_event) return ;
        Debug("[nthread] - Socket client received 'ready' from " + client_guuid);
        eventm.getEvent(`thread_${client_guuid}`).resolve(client);
      });

      client.on("msg", data => {
        if (!client_event) return ;
        Debug("[nthread] - Socket client received 'msg' from " + client_guuid);
        eventm.getEvent(`thread_${client_guuid}_msg`).resolveForced(data.content);
        eventm.getEvent(`thread_msg`).resolveForced({
          guuid: client_guuid,
          content: data.content
        });
      });

      client.on("log", data => {
        if (!client_event) return ;
        Debug("[nthread] - Socket client received 'log' from " + client_guuid);
        console.log(data.content);
      });

      client.on("disconnect", () => {
        if (!client_event) return ;
        Debug("[nthread] - Socket client received 'disconnect' from " + client_guuid);
        eventm.getEvent(`thread_${client_guuid}_disconnect`).resolve();
      });
    });
    // socket.listen(); // futur?
    return socket;
  };

  const listen = eventm.create("listen");

  this.server = await initServer();
  this.socket = await initSocket();

  return listen.getPromise();
};

module.exports = NThreadListen;
