const EventEmitter = require('events');
const publicIp = require("public-ip");
const getPort = require("get-port");
const socketio = require('socket.io');
const tempDir = require("temp-dir");

const ServerManager = require('./server');
const SocketManager = require('./socket');
const ThreadManager = require('./thread');

const { Debug } = require('../utils');

const defaultOptions = {
  debug: false,
  tmpFolder: `${tempDir}/nthread_generated`,
  secure: false
};

module.exports = class $nthread
{
  constructor(custom_options) {
    this.options = Object.assign({}, defaultOptions, custom_options);
    this.debug = Debug(this.options).debug;
    this.serverIsListening = false;

    this.modules = {};
    this.modules.event = new EventEmitter();
    this.modules.server = new ServerManager(this, this.options, this.modules);
  }

  async _createServerSocket(port) {
    const server = this.modules.server.createServer();
    const io = socketio(server, this.options.socket);
    const thread = new ThreadManager(this, this.options, this.modules);
    const socket = new SocketManager(this, this.options, this.modules, thread, io);

    this.options.port = port || await getPort();
    this.options.public_ip = await publicIp.v4();
    this.options.local_ip = '127.0.0.1';
    this.options.public_uri = `${this.options.protocol}${this.options.public_ip}:${this.options.port}`;
    this.options.local_uri = `${this.options.protocol}${this.options.local_ip}:${this.options.port}`;

    this.debug('[DEBUG]', `NTHREADJS-PARENT: creating a new server on port: ${this.options.port}`);
    return new Promise((resolve, reject) =>
      server.listen(this.options.port, (err) => {
        if (err) {
          this.debug('[DEBUG]', `NTHREADJS-PARENT: server ${this.options.port} have an error ${err}`);
          return reject(err);
        }
        this.debug('[DEBUG]', `NTHREADJS-PARENT: server ${this.options.port} is ready to listen`);
        resolve(thread);
      })
    );
  }

  async listen(port, callback) {
    if (this.serverIsListening) return ;
    this.serverIsListening = true;
    return new Promise(async (resolve, reject) =>
      await this._createServerSocket(port)
        .then(result => {
          if (callback) return callback(undefined, result);
          resolve(result);
        })
        .catch(err => {
          if (callback) return callback(err);
          reject(err);;
        })
    )
  };
};
