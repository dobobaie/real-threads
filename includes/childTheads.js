var fs = require('fs');
var proc = require('process');

var ChildThreads = function()
{
	var $enum = {
		NONE: null,
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

		process.stdout.write(JSON.stringify({
			type: $enum.STATUS_MESSAGE.START,
			pid: proc.pid,
		}));

		process.stdin.on('data', (data) => {
			console.log('CHILD got message:', data.toString());
		});

		console.log('ici');
		for (var i=0;i<=10000000000;i++);
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
		//
	}

	this.wait = function(callback, removeAftercalled)
	{
		//
	}

	var _engine = {
		this: this,
		pid: proc.pid,
		infos_process: {
			parentpid: null,
			filename: null,
			defaultName: null,
			nameIsNull: false,
		},
	};

	return _engine.this;
}

module.exports = new ChildThreads;

