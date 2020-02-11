const { Debug } = require('../utils');

module.exports = class ChildThread
{
  constructor(nthread, options, modules, thread, guuid) {
    this.options = options;
    this.debug = Debug(this.options).debug;
    this.nthread = nthread;
    this.modules = modules;
    this.thread = thread;
    this.guuid = guuid;
  
    this.connected = false;
    this.client = null;
  }

  _authenticateThread(client) {
    this.connected = true;
    this.client = client;
  }

  emit(request) {
    this.client.emit("request", { request });
    return this;
  }

  response(cb) {
    return this.modules.event.on(`${this.guuid}_client_response`, cb);
  }

  close() {
    if (!this.client) return ;
    this.client.disconnect();
  };

  getPid() {
    return this.thread && this.thread.pid;
  }

  getGuuid() {
    return this.guuid;
  }

  on(...args) {
    const event = args.shift();
    return this.modules.event.on(`${this.guuid}_child_process_${event}`, ...args);
  }
};
