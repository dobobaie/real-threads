const http = require('http');
const https = require('https');

const { Debug } = require('../utils');

module.exports = class Server
{
  constructor(nthread, options, modules) {
    this.options = options;
    this.debug = Debug(this.options).debug;
    this.nthread = nthread;
    this.modules = modules;
  }

  createServer() {
    const server = this.options.secure === true
      ? https.createServer(this.options.server)
      : http.createServer(this.options.server);
    this.options.protocol = this.options.secure === true
      ? 'https://'
      : 'http://';
    return server; 
  }
};
