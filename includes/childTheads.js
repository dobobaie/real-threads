var fs = require('fs');
var proc = require('process');

var ChildThreads = function()
{
	var $enum = {
		NONE: null,
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

	this.synch = function()
	{
		if (process.argv[2] !== undefined) {
			_engine.infos_process.filename = process.argv[2];
		}
		if (process.argv[3] !== undefined) {
			_engine.infos_process.parentpid = process.argv[3];
		}
		if (process.argv[4] !== undefined) {
			_engine.infos_process.defaultName = process.argv[4];
		}
		if (process.argv[5] !== undefined) {
			_engine.infos_process.nameIsNull = process.argv[5];
			if (_engine.infos_process.nameIsNull === 'true' || _engine.infos_process.nameIsNull === true) {
				_engine.infos_process.defaultName = null;
			}
		}

		_engine.status = $enum.STATUS.RUNNING;

		process.stdout.write(JSON.stringify({
			type: $enum.STATUS_MESSAGE.START,
			pid: proc.pid,
		}));

		process.stdout.on('data', (data) => {
			console.log('CHILD got message:', data.toString());
		});
	}

	this.run = function()
	{
		var child = require(_engine.infos_process.filename);
		return child(_engine.this);
	}

	this.getName = function()
	{
		return _engine.infos_process.defaultName;
	}
	
	this.send = function(data)
	{
		process.stdout.write(JSON.stringify({
			type: $enum.STATUS_MESSAGE.MESSAGE,
			pid: data,
		}));
		return _engine.this;
	}

	this.kill = function(signal)
	{
		if (_engine.status === $enum.STATUS.RUNNING) {
			_engine.status = $enum.STATUS.FINISH;
			process.kill(_engine.pid);
		}
		return _engine.this;
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

	var _engine = {
		this: this,
		status: $enum.STATUS.WAITING,
		pid: proc.pid,
		infos_process: {
			parentpid: null,
			filename: null,
			defaultName: null,
			nameIsNull: false,
		},
		callbacks: [],
	};

	return _engine.this;
}

module.exports = new ChildThreads;

