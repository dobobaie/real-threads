const fs = require('fs');
const spawn = require("child_process").spawn;

const { Debug } = require('../utils');

module.exports = class ThreadUtils
{
  constructor(nthread, options, modules) {
    this.options = options;
    this.debug = Debug(this.options).debug;
    this.nthread = nthread;
    this.modules = modules;
  }

  createThreadFile(guuid, thread_code) {
    const location_file = `${this.options.tmpFolder}/${guuid}.js`;
    if (!fs.existsSync(this.options.tmpFolder)) {
      fs.mkdirSync(this.options.tmpFolder);
    }
    fs.writeFileSync(
      location_file,
      ` const { Child } = require('${__dirname.replace(/\\/g, "/")}/../index');
        const child = new Child({ debug: ${this.options.debug} });
        child.connect("${this.options.local_uri}", "${guuid}")
          .then(${thread_code});`
    );
    return location_file;
  };

  _configureEvent(guuid, event, content) {
    this.debug('[DEBUG]', `NTHREAD-CHILD: ${event}`, guuid, content);
    this.modules.event.emit(`${guuid}_child_process_${event}`, content);
    this.modules.event.emit(`${guuid}_child_process_*`, { event, content });
    this.modules.event.emit(`*_child_process_${event}`, { guuid, content });
    this.modules.event.emit(`*_child_process_*`, { event, guuid, content });
    this.modules.event.emit(`*`, { event: `child_process_${event}`, guuid, content }); 
  }

  spawnChildProcess(guuid, threadFile) {
    const childProcess = spawn("node", [`${this.options.tmpFolder}/${guuid}.js`]);

    childProcess.stdout.on("data", data =>
      this._configureEvent(guuid, 'stdout', data?.toString())
    );

    childProcess.stderr.on("data", data =>
      this._configureEvent(guuid, 'stderr', data?.toString())
    );

    childProcess.on("exit", data =>
      this._configureEvent(guuid, 'exit', data?.toString())
    );

    childProcess.on("close", () =>
      this._configureEvent(guuid, 'close')
    );

    return childProcess
  }
};
