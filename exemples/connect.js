const nthread = require('../nthread')({ enableSocket: false });

nthread.ready(async (mthread) =>
{
	try
	{
		const thread = await mthread.connect('http://127.0.0.1:6000', 'testOne', 'testTwo');

		console.log('Connected');

		let cres = await thread.response();
		console.log('CHILD', cres);
		thread.send(`Now I'm sending a message to my child`);

	} catch (e) { console.log(e); mthread.disconnect(); }

}).catch(err => console.log(err));
