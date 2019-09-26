const NThreadListen = require('./nthread');
const NThreadConnect = require('./cthread');

module.exports = {
  listen: NThreadListen,
  connect: NThreadConnect
};
