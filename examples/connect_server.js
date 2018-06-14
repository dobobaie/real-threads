const nthread = require('../nthread')({ port: 6000 });

nthread.ready(async (mthread) =>
{
	try
	{
		console.log(mthread.localAddress);

		mthread.connection(async (thread) => {
			console.log('New connection');
			
			let params = thread.params;
			thread.send(`Now I'm sending child params : ${JSON.stringify(params)}`);
			let pres = await thread.response();
			console.log('ROOT', pres);
		});

	} catch (e) { console.log(e); mthread.disconnect(); }

}).catch(err => console.log(err));
