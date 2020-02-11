const safeStringify = require('fast-safe-stringify');

/**
  * @name: Debug
  */
const Debug = options => {
  const listDebugTime = {};

  const _join = (...args) =>
    args.reduce((log, argument) => {
      log += typeof argument === 'object' && argument !== null
        ? safeStringify(argument.stack || argument)
        : argument;
      return log + ' ';
    }, '').trim();

  const debug = (...args) =>
    options.debug && console.log(_join(...args));
  
  const debugExit = event => (...args) => {
    debug(event, ...args);
    process.exit(0);
  };

  const debugTime = id => label => (...args) => {
    listDebugTime[id + label] = new Date();
    debug(id, label, ...args);
  };
  
  const debugTimeEnd = id => label => (...args) => {
    const currentDate = new Date();
    const time = `: ${(currentDate - listDebugTime[id + label]) / 1000}s`;
    delete listDebugTime[id + label];
    debug(id, label, ...args, time);
  };

  return {
    debug,
    debugExit,
    debugTime,
    debugTimeEnd
  }
};

module.exports = {
  Debug
};
