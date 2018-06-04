const fs = require('fs');
// const publicIp = require('public-ip');
// const getPort = require('get-port');
// const http = require('http');
// const io = require('socket.io');
// const spawn = require('child_process').spawn;
// const uuidv4 = require('uuid/v4');
const io = require('socket.io-client');

const config = require(__dirname + '/config');
const mevent = require(__dirname + '/mevent');

const $childProcess = (guid, socket) => function(params)
{
	this.params = params;
	this.send = (data) => socket.emit('msg', {
		content: data,
	});
	this.response = (cb) => mevent('child').on('response', cb, { onlyData: true });
}

const $process = async () =>
{
	const guid = process.argv[2];
	const ip = process.argv[3];
	const port = process.argv[4];

	if (!fs.existsSync(`${config.tmpFolder}/${guid}.js`)) {
		return socket.emit('fileNotFound');
	}

	const childProcess = require(`${config.tmpFolder}/${guid}.js`);
	fs.unlinkSync(`${config.tmpFolder}/${guid}.js`);

	const socket = io(`${ip}:${port}`);
	
	socket.on('connect', () => socket.emit('hello', {
		guid: guid,
	}));

	socket.on('hello', async () => await childProcess.threadCode(
		new ($childProcess(guid, socket))(childProcess.threadParams)
	));

	socket.on('msg', (data) => mevent('child').resolve('response', data.content));

	socket.on('disconnect', () => {
		console.log('disconnect');
	});
}

module.exports = $process();
