const EventEmitter = require('events');
const io = require('socket.io-client');

const ThreadManager = require('./thread');

const { Debug } = require('../utils');

const defaultOptions = {
  debug: false,
  socket: {
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionAttempts: 10
  }
};

module.exports = class $cthread
{
  constructor(custom_options) {
    this.options = Object.assign({}, defaultOptions, custom_options);
    this.options.timeout = parseInt(this.options.timeout);
    this.debug = Debug(this.options).debug;

    this.modules = {};
    this.modules.event = new EventEmitter();
  }

  connect(url, guuid) {
    this.options.guuid = guuid;

    const socket = io(url, this.options.socket);  
    const thread = new ThreadManager(this, this.options, this.modules, socket);

    socket.on('connect', () =>
      this.debug('[DEBUG]', `CTHREAD-PARENT: socket new connection`)
    );
    socket.on('hello', () => {
      this.debug('[DEBUG]', `CTHREAD-PARENT: socket received hello`);
      socket.emit('hello', { guuid: this.options.guuid })
      if (this.options.guuid === undefined) return ;
      this.modules.event.emit(`client_connected`, thread);
    });
    socket.on('request', ({ request }) => {
      this.debug('[DEBUG]', `CTHREAD-PARENT: socket received request`, request);
      this.modules.event.emit(`client_request`, request);
    });
    socket.on('authenticate', ({ guuid }) => {
      this.debug('[DEBUG]', `CTHREAD-PARENT: socket received authenticate`, guuid);
      if (this.options.guuid !== undefined) return ;
      this.options.guuid = guuid;
      this.modules.event.emit(`client_connected`, thread);
    });
    socket.on('disconnect', () =>
      this.debug('[DEBUG]', `CTHREAD-PARENT: socket disconnected`)
    );

    return new Promise(resolve =>
      thread.on(`client_connected`, resolve)
    );
  }
};
