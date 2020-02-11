const { Debug } = require('../utils');

module.exports = class Thread
{
  constructor(cthread, options, modules, socket) {
    this.options = options;
    this.debug = Debug(this.options).debug;
    this.debugExit = Debug(this.options).debugExit;
    this.cthread = cthread;
    this.modules = modules;
    this.socket = socket;

    process.on('exit', () => this.close());
    process.on('SIGINT', this.debugExit('[DEBUG] - SIGINT'));
    process.on('SIGUSR1', this.debugExit('[DEBUG] - SIGUSR1'));
    process.on('SIGUSR2', this.debugExit('[DEBUG] - SIGUSR2'));
    process.on('uncaughtException', this.debugExit('[DEBUG] - uncaughtException'));
  }

  log(...args) {
    this.socket.emit('log', { log: args.join(' ') });
    return this;
  }

  emit(response) {
    this.socket.emit('response', { response });
    return this;
  }

  response(cb) {
    return this.on(`${this.options.guuid}_client_request`, cb);
  }

  close() {
    this.socket.close();
  }
  
  getPid() {
    return process.pid;
  }

  getGuuid() {
    return this.options.guuid;
  }

  on(...args) {
    return this.modules.event.on(...args);
  }
};
