const Promise = require("bluebird");

const fs = require('fs');
const processExists = require("process-exists");
const uuidv4 = require("uuid/v4");

const ChildThreadManager = require('./childThread');
const threadUtilsManager = require('./threadUtils');

const { Debug } = require('../utils');

module.exports = class Thread
{
  constructor(nthread, options, modules) {
    this.options = options;
    this.debug = Debug(this.options).debug;
    this.debugExit = Debug(this.options).debugExit;
    this.nthread = nthread;
    this.modules = modules;
  
    this.threadUtils = new threadUtilsManager(nthread, options, modules);
  
    process.on('exit', () => this.close());
    process.on('SIGINT', this.debugExit('[DEBUG] - SIGINT'));
    process.on('SIGUSR1', this.debugExit('[DEBUG] - SIGUSR1'));
    process.on('SIGUSR2', this.debugExit('[DEBUG] - SIGUSR2'));
    process.on('uncaughtException', this.debugExit('[DEBUG] - uncaughtException'));

    this.listThreads = { list: {} };
  }

  async _closeChildThread(guuid) {
    if (!this.listThreads.list[guuid]) return ;
    
    this.debug('[DEBUG]', `NTHREAD-CHILD: closing child thread`, guuid);
    
    if (this.listThreads.list[guuid].childThread) {
      await this.listThreads.list[guuid].childThread.close();
      this.listThreads.list[guuid].childThread = null;
    }

    const childProcess = this.listThreads.list[guuid].childProcess;
    if (childProcess) {
      const pidExists = await processExists(childProcess.pid);
      try {
        if (pidExists) process.kill(childProcess.pid);
        this.listThreads.list[guuid].childProcess = null;
      } catch (e) {
        //
      }
    }

    if (fs.existsSync(`${this.options.tmpFolder}/${guuid}.js`)) {
      fs.unlinkSync(`${this.options.tmpFolder}/${guuid}.js`);
    }

    delete this.listThreads.list[guuid];
  
    this.debug('[DEBUG]', `NTHREAD-CHILD: child thread has been closed`, guuid);
  }

  async close() {
    this.debug('[DEBUG]', `NTHREAD-CHILD: closing all children threads`);
    await Promise.each(Object.keys(this.listThreads.list), thread_key =>
      this._closeChildThread(thread_key)
    );
    this.debug('[DEBUG]', `NTHREAD-CHILD: all children threads has been closed`);
  }

  _createIdentity() {
    this.debug('[DEBUG]', `NTHREAD-CHILD: creating a new idendity thread`);

    const guuid = uuidv4();
    const childThread = new ChildThreadManager(this.nthread, this.options, this.modules, this, guuid);
    
    this.listThreads.list[guuid] = {};
    this.listThreads.list[guuid].childThread = childThread;
    
    this.on(`${guuid}_client_disconnected`, () =>
      this._closeChildThread(guuid)
    );

    this.debug('[DEBUG]', `NTHREAD-CHILD: A new identify thread has been created`, guuid);
    
    return guuid;
  }

  create(thread_code) {
    const guuid = this._createIdentity();
    const threadFile = this.threadUtils.createThreadFile(guuid, thread_code);
    const childProcess = this.threadUtils.spawnChildProcess(guuid, threadFile);
    
    this.listThreads.list[guuid].childProcess = childProcess;

    this.on(`${guuid}_child_process_close`, () =>
      this._closeChildThread(guuid)
    );

    this.debug('[DEBUG]', `NTHREAD-CHILD: A new child thread has been created`, guuid);
    
    return new Promise(resolve =>
      this.on(`${guuid}_client_connected`, () =>
        resolve(this.listThreads.list[guuid].childThread)
      )
    );
  }

  load(loadFile) {
    const thread_code = require(loadFile);
    return this.create(thread_code);
  }

  emit(request) {
    Object.keys(this.listThreads.list).map(guuid =>
      this.listThreads.list[guuid].childThread.emit(request)
    );
  }

  response(cb) {
    return this.modules.event.on(`*_client_response`, ({ guuid, content }) =>
      cb(this.getChildThreadByGuuid(guuid), content)
    );
  }

  getPublicUri() {
    return this.options.public_uri;
  }

  getLocalUri() {
    return this.options.local_uri;
  }

  getChildThreadByGuuid(guuid) {
    return this.listThreads.list[guuid] && this.listThreads.list[guuid].childThread;
  }

  getAllChildrenThread() {
    return Object.keys(this.listThreads.list).map(guuid =>
      ({ guuid, childThread: this.listThreads.list[guuid].childThread })
    );
  }

  on(...args) {
    return this.modules.event.on(...args);
  }
};
