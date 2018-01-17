var fs = require('fs');
var proc = require('process');
var spawn = require('child_process').spawn;

var Threads = function()
{
	var $enum = {
		NONE: null,
		TYPE: {
			ROOT: 'root',
			CHILD: 'child',
		},
		STATUS: {
			WAITING: 'waiting',
			RUNNING: 'running',
			FINISH: 'finish',
		},
		STATUS_MESSAGE: {
			START: 'start',
			MESSAGE: 'message',
			RELEASE: 'release',
		},
	};

	var path_process = __dirname + '/process/';
	var path_jsgenerated = path_process + 'jsgenerated/';

	try {
		fs.statSync(path_process);
	} catch(e) {
		fs.mkdirSync(path_process);
	}

	try {
		fs.statSync(path_jsgenerated);
	} catch(e) {
		fs.mkdirSync(path_jsgenerated);
	}

	var $process = function(processName)
	{
		this.create = function(name, callback, data)
		{
			name = (name !== null && typeof(name) === 'string' ? name : null);
			if (name !== null && _engine.this[name] !== undefined) {
				return false;
			}

			var date = new Date();
			if (typeof(callback) === 'function') {
				var filename = path_process + date.getTime() + '_' + _engine.pid + '_' + name;
				fs.writeFileSync(filename, 'var cb = ' + callback.toString() + '; module.exports = cb;');	
				callback = filename;
			}

			var process = new $process(name);
			process = process.init($enum.TYPE.CHILD, _engine);
			process.set(callback, data);
		
			if (name !== null) {
				_engine.this[name] = process;
			}

			return _engine.this[name];
		}

		this.join = function(callback, data)
		{
			return _engine.this.create(null, callback, data);
		}

		this.init = function(type, parent)
		{
			_engine.parent = parent;
			_engine.type = type;
			switch (_engine.type)
			{
				case $enum.TYPE.ROOT:
					_engine.status = $enum.STATUS.RUNNING;
					delete _engine.this.set;
					delete _engine.this.on;
					delete _engine.this.ready;
					delete _engine.this.wait;
					delete _engine.this.send;
				break;
				case $enum.TYPE.CHILD:
					_engine.status = $enum.STATUS.WAITING;
					delete _engine.this.kill;
					delete _engine.this.complete;
					delete _engine.this.create;
					delete _engine.this.join;
				break;
			}
			delete _engine.this.init;
			return _engine.this;
		}

		this.set = function(filename, data)
		{
			_engine.process = spawn('node', [__dirname + '/includes/join.js', filename, _engine.pid, _engine.name, (typeof(_engine.name) === 'string' ? 'true' : 'false')]);

			_engine.process.stdin.on('data', (data) =>
			{
				var instructions = JSON.parse(data.toString());
				
				console.log(instructions);

				if (_engine.status === $enum.STATUS.WAITING) {
					_engine.pid = instructions.pid;
					_engine.status = $enum.STATUS.RUNNING;
					$execCallbacks('ready', _engine.pid);
					return ;
				}

				if (instructions.type === $enum.STATUS_MESSAGE.RELEASE) {
					$execCallbacks('wait', instructions.data);
					return ;
				}

				$execCallbacks('data', instructions.data);
			});

			_engine.process.stdout.on('data', function(data) {
				console.log('ici', data.toString());
				$execCallbacks('out', data.toString());
			});

			_engine.process.stderr.on('data', function(data) {
				console.log('ici2', data.toString());
				$execCallbacks('err', data.toString());
			});

			_engine.process.on('exit', function(code) {
				_engine.status = $enum.STATUS.FINISH;
				$execCallbacks('exit', code);
			});

			delete _engine.this.set;
			return _engine.this;
		}

		this.complete = function(callback, removeAfterCall)
		{
			_engine.callbacks.push({
				type: 'complete',
				callback: callback,
				removeAfterCall: removeAfterCall,
			});
			return _engine.this;
		}

		this.send = function(data)
		{
			if (_engine.status === $enum.STATUS.RUNNING) {
				_engine.process.stdin.write(JSON.stringify({
					type: $enum.STATUS_MESSAGE.MESSAGE,
					data: data,
				}));
			}
			return _engine.this;
		}

		this.kill = function(pid, signal)
		{
			var copyCallback = _engine.childrens;
			_engine.childrens = [];
			for (var index in copyCallback) {
				if (copyCallback[index].getPid() === pid) {
					if (_engine.childrens[index].getName() !== null && _engine.this[_engine.childrens[index].getName()] !== undefined) {
						delete _engine.this[_engine.childrens[index].getName()];
					}
					if (_engine.childrens[index].getStatus() !== $enum.STATUS.RUNNING) {
						continue ;
					}
					var process = _engine.childrens[index].getProcess();
					process.kill((typeof(signal) === 'string' ? signal : 'SIGHUP'));
					continue ;
				}
				_engine.childrens.push(copyCallback[index]);
			}
			return _engine.this;
		}

		this.ready = function(callback, removeAfterCall)
		{
			return _engine.this.on('ready', callback, removeAfterCall);
		}

		this.wait = function(callback, removeAfterCall)
		{
			return _engine.this.on('wait', callback, removeAfterCall);
		}

		this.on = function(type, callback, removeAfterCall)
		{
			_engine.callbacks.push({
				type: type,
				callback: callback,
				removeAfterCall: removeAfterCall,
			});
			return _engine.this;
		}

		this.getName = function()
		{
			return _engine.name;
		}
		
		this.getStatus = function()
		{
			return _engine.status;
		}
		
		this.getPid = function()
		{
			return _engine.pid;
		}

		this.getProcess = function()
		{
			return _engine.process;
		}

		var $execCallbacks = function(type, data)
		{
			var copyCallback = _engine.callbacks;
			_engine.callbacks = [];
			for (var index in copyCallback) {
				if (copyCallback[index].type !== type) {
					continue ;
				}
				if (typeof(copyCallback[index].removeAfterCall) == 'boolean' && copyCallback[index].removeAfterCall == false) {
					_engine.callbacks.push(copyCallback[index]);
				}
				copyCallback[index].callback(data);
			}
		}

		var _engine = {
			this: this,
			pid: proc.pid,
			name: processName,
			status: $enum.WAITING,
			type: $enum.NONE,
			process: null,
			parent: null,
			childrens: [],
			callbacks: [],
		};
	}

	var process = new $process('root');
	return process.init($enum.TYPE.ROOT);
}

module.exports = Threads;

