const fs = require('fs');
const publicIp = require('public-ip');
const getPort = require('get-port');
const http = require('http');
const io = require('socket.io');
const spawn = require('child_process').spawn;
const uuidv4 = require('uuid/v4');
const tempDir = require('temp-dir');

const cthread = require(__dirname + '/cthread');
const mevent = require(__dirname + '/mevent');

const $buildCode = (guid, uri) => (threadParams, threadCode) => `
	require('${__dirname.replace(/\\/g, '/')}/cthread')({
		guid: "${guid}",
		uri: "${uri}",
		params: ${threadParams},
	}).ready(${threadCode});
`;

const $childProcess = (options, listThreads) => function(guid, params)
{
	this.guid = guid;
	this.params = params;

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
	
	this.ready = (cb) => mevent(`child_${guid}`).on('ready', cb, { onlyData: true, cache: true });
	
	this.response = (cb) => mevent(`child_${guid}`).on('response', cb, { onlyData: true });
	
	this.stdout = (cb) => mevent(`child_${guid}`).on('stdout', cb, { isUnique: false, onlyData: true });
	
	this.stderr = (cb) => mevent(`child_${guid}`).on('stderr', cb, { isUnique: false, onlyData: true });
	
	this.exit = (cb) => mevent(`child_${guid}`).on('exit', cb, { isUnique: false, onlyData: true, cache: true });		
	
	this.disconnect = () => {
		// déconnecter le client
		// supprimer le fichier
	};
};

const generateIdentity = (listThreads) => (isExternal) => {
	let guid = uuidv4();
	listThreads[guid] = {
		guid: guid,
		serverStatus: false,
		spawn: null,
		socket: null,
		isExternal: isExternal,
	};
	return guid;
}

const $parentProcess = (options, listThreads) => function(ip, port)
{
	this.options = options;
	
	this.connect = async (...arguments) => cthread({
		guid: null,
		uri: arguments[0],
		sendParams: arguments.filter((value, key) => key !== 0),
	}).ready();

	if (!options.enableSocket) {
		return this;
	}

	this.ip = ip;
	this.localIp = '127.0.0.1';
	this.port = port;
	this.address = `${options.protocol}${ip}:${port}`;
	this.localAddress = `${options.protocol}${this.localIp}:${port}`;

	this.connection = async (cb) => mevent('mparent').on('connection', cb, { isUnique: false, onlyData: true });

	const createChild = (...arguments) => (isFile) => {
		let threadCode = (isFile === true ? fs.readFileSync(arguments[0]).toString() : arguments[0]);
		let threadParams = arguments.filter((value, key) => key !== 0);
		let guid = generateIdentity(listThreads)(false);

		fs.writeFileSync(`${tempDir}/${options.tmpFolder}/${guid}.js`, $buildCode(guid, this.localAddress)(JSON.stringify(threadParams), threadCode.toString()));

		listThreads[guid].spawn = spawn('node', [`${tempDir}/${options.tmpFolder}/${guid}.js`]);
		listThreads[guid].spawn.stdout.on('data', async (data) => mevent(`child_${guid}`).resolve('stdout', data.toString()));
		listThreads[guid].spawn.stderr.on('data', async (data) => mevent(`child_${guid}`).resolve('stderr', data.toString()));
		listThreads[guid].spawn.on('exit', async (data) => mevent(`child_${guid}`).resolve('exit', data.toString()));
		listThreads[guid].spawn.on('close', async () => fs.unlinkSync(`${tempDir}/${options.tmpFolder}/${guid}.js`));

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
	options.tmpFolder = 'generated';
	options.protocol = (options.protocol ? options.protocol : 'http://');
	options.enableSocket = (options.enableSocket !== undefined ? options.enableSocket : true);

	if (!options.enableSocket) {
		return mevent('mroot').resolve('ready', new ($parentProcess(options))());	
	}

	let listThreads = {};

	// let ip = await publicIp.v4();
	let ip = await publicIp.v4().catch(err => '127.0.0.1');
	let port = (options.port ? options.port : await getPort());

	let server = http.createServer();
	let socket = io(server);

	if (!fs.existsSync(`${tempDir}/${options.tmpFolder}`)) {
		fs.mkdirSync(`${tempDir}/${options.tmpFolder}`);
	}

	socket.on('connection', function(client)
	{
		let clientGuid = null;

		client.on('hello', (data) =>
		{
			if (clientGuid !== null) return ;

			if (data.guid === null || !listThreads[data.guid]) {
				data.guid = generateIdentity(listThreads)(true);
			}

			clientGuid = data.guid;
			listThreads[clientGuid].serverStatus = true;
			listThreads[clientGuid].socket = client;
			client.emit('hello');

			(listThreads[clientGuid].isExternal
			? mevent('mparent').resolve('connection', new ($childProcess(options, listThreads))(data.guid, data.params))
			: mevent(`child_${clientGuid}`).resolve('ready'));
		});
		
		client.on('msg', (data) => {
			if (clientGuid === null) {
				return ;
			}
			mevent(`child_${clientGuid}`).resolve('response', data.content);
		});

		client.on('disconnect', () => {
			listThreads[clientGuid].serverStatus = false;
			delete listThreads[clientGuid];
			clientGuid = null;
		});
	});

	server.listen(port, (err, data) => (err
		? mevent('mroot').reject('ready', err)
		: mevent('mroot').resolve('ready', new ($parentProcess(options, listThreads))(ip, port))
	));

	return  mevent('mroot').on('ready');
}

module.exports = (options) => ({
	$process: $process(options),
	ready: (cb) => mevent('mroot').on('ready', cb, { onlyData: true, cache: true }),
});