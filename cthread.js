const fs = require('fs');
const io = require('socket.io-client');
const tempDir = require('temp-dir');
const eventm = require('eventm');

const $childProcess = (guid, socket) => function(params)
{
	this.params = params;

	this.send = (data) => socket.emit('msg', {
		content: data,
	});
	
	this.response = (cb) => eventm('cchild').on('response', cb, { onlyData: true, cache: true, removeCache: true, promise: true });
}

const $process = async (options) =>
{
	const guid = options.guid;
	const uri = options.uri;
	const sendParams = (options.sendParams ? options.sendParams : []);

	const socket = io(uri);
	
	socket.on('connect', () => socket.emit('hello', {
		guid: guid,
		params: sendParams,
	}));

	socket.on('hello', async () => eventm('croot').resolve('ready', (
		new ($childProcess(guid, socket))(options.params)
	)));

	socket.on('msg', (data) => {
		eventm('cchild').resolve('response', data.content)
	});

	socket.on('disconnect', () => {
		console.log('disconnect');
	});
}

module.exports = (options) => ({
	$process: $process(options),
	ready: (cb) => eventm('croot').on('ready', cb, { isUnique: false, onlyData: true, cache: true, promise: true }),
});
