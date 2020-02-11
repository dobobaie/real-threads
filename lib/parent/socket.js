const { Debug } = require('../utils');

module.exports = class Socket
{
  constructor(nthread, options, modules, thread, io) {
    this.options = options;
    this.debug = Debug(this.options).debug;
    this.nthread = nthread;
    this.modules = modules;
    this.thread = thread;
    this.clients = { list: {}, number: 0 };
    this._initializeIoListeners(io);
  }

  _configureEvent(guuid, event, content) {
    this.debug('[DEBUG]', `NTHREAD-PARENT: ${event}`, guuid, content);
    this.modules.event.emit(`${guuid}_client_${event}`, content);
    this.modules.event.emit(`${guuid}_client_*`, { event, content });
    this.modules.event.emit(`*_client_${event}`, { guuid, content });
    this.modules.event.emit(`*_client_*`, { event, guuid, content });
    this.modules.event.emit(`*`, { event: `client_${event}`, guuid, content }); 
  }

  _clientHello(client, { guuid }) {
    this.debug('[DEBUG]', `NTHREAD-PARENT: socket received hello`, client.id, guuid);
    if (!guuid) {
      guuid = this.thread._createIdentity();
      client.emit('authenticate', { guuid });
    }
    let childThread = this.thread.getChildThreadByGuuid(guuid);
    if (!childThread) return client.disconnect();
    childThread._authenticateThread(client);
    this.clients.list[client.id] = { guuid, client };
    this.clients.number += 1;
    this._configureEvent(guuid, 'connected', guuid);
  }

  _clientResponse(client, { response }) {
    this.debug('[DEBUG]', `NTHREAD-PARENT: socket received response`, client.id, response);
    const _client = this.clients.list[client.id];
    const guuid = _client && _client.guuid;
    const childThread = this.thread.getChildThreadByGuuid(guuid);
    if (!childThread) return client.disconnect();
    this._configureEvent(guuid, 'response', response);
  }

  _clientLog(client, { log }) {
    this.debug('[DEBUG]', `NTHREAD-PARENT: socket received log`, client.id, log);
    const _client = this.clients.list[client.id];
    const guuid = _client && _client.guuid;
    const childThread = this.thread.getChildThreadByGuuid(guuid);
    if (!childThread) return client.disconnect();
    this._configureEvent(guuid, 'log', log);
  }

  _clientDisconnect(client) {
    this.debug('[DEBUG]', `NTHREAD-PARENT: socket connection closed`, client.id);
    const _client = this.clients.list[client.id];
    const guuid = _client && _client.guuid;
    const childThread = this.thread.getChildThreadByGuuid(guuid);
    if (!childThread) return ;
    delete this.clients.list[client.id];
    this.clients.number -= 1;
    this._configureEvent(guuid, 'disconnected');
  }

  _initializeClientListeners(client) {
    client.on('hello', request =>
      this._clientHello(client, request)
    );
    client.on('response', request =>
      this._clientResponse(client, request)
    );
    client.on('log', request =>
      this._clientLog(client, request)
    );
    client.on('disconnect', () =>
      this._clientDisconnect(client)
    );
  }

  _newClientConnection(client) {
    this.debug('[DEBUG]', `NTHREAD-PARENT: socket new connection`, client.id);
    this._initializeClientListeners(client);
    client.emit('hello');
  }

  _initializeIoListeners(io) {
    io.on('connection', client =>
      this._newClientConnection(client)
    );
  }

  retrieveClientById(client_id) {
    return this.clients.list[client_id];
  }

  getClientsList() {
    return this.clients.list;
  }

  getNumberClients() {
    return this.clients.number;
  }
};
