const fs = require('fs');
const publicIp = require('public-ip');
const getPort = require('get-port');
const http = require('http');
const io = require('socket.io');
const spawn = require('child_process').spawn;
const uuidv4 = require('uuid/v4');

const config = require(__dirname + '/config');
const mevent = require(__dirname + '/mevent');

const $childProcess = (options, listThreads) => function(guid)
{
	this.guid = guid;
	
	this.send = (data) => 
	{
		if (!listThreads[guid].serverStatus) {
			return mevent(`child_${guid}`).on('ready', () => listThreads[guid].socket.emit('msg', {
				content: data,
			}));
		}
		listThreads[guid].socket.emit('msg', {
			content: data,
		});
		return this;
	}
	
	this.on = mevent(`child_${guid}`).on;
	
	this.ready = (cb) => mevent(`child_${guid}`).on('ready', cb, { onlyData: true });
	
	this.response = (cb) => mevent(`child_${guid}`).on('response', cb, { onlyData: true });
	
	this.stdout = (cb) => mevent(`child_${guid}`).on('stdout', cb, { isUnique: false, onlyData: true });
	
	this.stderr = (cb) => mevent(`child_${guid}`).on('stderr', cb, { isUnique: false, onlyData: true });
	
	this.exit = (cb) => mevent(`child_${guid}`).on('exit', cb, { isUnique: false, onlyData: true });		
	
	this.disconnect = () => {
		// déconnecter le client
		// supprimer le fichier
	};
};

const $parentProcess = (options, listThreads) => function(ip, port)
{
	this.connect = async (...arguments) => {
		//
	}

	const createChild = (...arguments) => (isFile) => {
		let threadCode = (isFile === true ? fs.readFileSync(arguments[0]).toString() : arguments[0]);
		let threadParams = arguments.filter((value, key) => key !== 0);
		let guid = uuidv4();
		listThreads[guid] = {
			guid: guid,
			serverStatus: false,
			spawn: null,
			socket: null,
		};

		fs.writeFileSync(`${config.tmpFolder}/${guid}.js`, `module.exports = { threadParams: ${JSON.stringify(threadParams)}, threadCode: ${threadCode.toString()} }`);

		listThreads[guid].spawn = spawn('node', [__dirname + '/cthread.js', guid, options.protocol + '127.0.0.1', port]);
		listThreads[guid].spawn.stdout.on('data', async (data) => mevent(`child_${guid}`).resolve('stdout', data.toString()));
		listThreads[guid].spawn.stderr.on('data', async (data) => mevent(`child_${guid}`).resolve('stderr', data.toString()));
		listThreads[guid].spawn.on('exit', async (data) => mevent(`child_${guid}`).resolve('exit', data.toString()));

		return new ($childProcess(options, listThreads))(guid);
	};

	this.create = async (...arguments) => createChild(...arguments)(false);
	
	this.load = async (...arguments) => createChild(...arguments)(true);
	
	this.disconnect = async () => {
		// déconnecter tout les clients
		// supprimer les fichiers tmp
	};
};

const $process = async (options) =>
{
	options = (options ? options : {});
	options.protocol = (options.protocol ? options.protocol : 'http://');

	let listThreads = {};

	let ip = await publicIp.v4();
	let port = await getPort();

	let server = http.createServer();
	let socket = io(server);

	if (!fs.existsSync(config.tmpFolder)) {
		fs.mkdirSync(config.tmpFolder);
	}

	socket.on('connection', function(client)
	{
		let clientGuid = null;

		client.on('hello', (data) => {
			if (clientGuid !== null || !listThreads[data.guid]) {
				return ;
			}
			clientGuid = data.guid;
			listThreads[clientGuid].serverStatus = true;
			listThreads[clientGuid].socket = client;
			client.emit('hello');
			mevent(`child_${clientGuid}`).resolve('ready');
		});
		
		client.on('msg', (data) => {
			if (clientGuid === null) {
				return ;
			}
			mevent(`child_${clientGuid}`).resolve('response', data.content);
		});

		client.on('fileNotFound', (data) => {
			// disconnect
		});

		client.on('disconnect', () => {
			listThreads[clientGuid].serverStatus = false;
			delete listThreads[clientGuid];
			clientGuid = null;
		});
	});

	server.listen(port, (err, data) => (err
		? mevent('parent').reject('ready', err)
		: mevent('parent').resolve('ready', new ($parentProcess(options, listThreads))(ip, port))
	));

	return  mevent('parent').on('ready');
}

module.exports = (options) => ({
	$process: $process(options),
	ready: (cb) => mevent('parent').on('ready', cb, { onlyData: true }),
});