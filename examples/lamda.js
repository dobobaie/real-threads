const nthread = require('../nthread')();

nthread.ready(async (mthread) =>
{
	try
	{
		let child = await mthread.create(async (thread) => {
			let params = thread.params;
			thread.send(`Now I'm sending child params : ${JSON.stringify(params)}`);
			let pres = await thread.response();
			console.log('CHILD', pres);
		}, 'testOne', 'testTwo');

		child.stdout((data) => {
			console.log('child stdout', data);
		});

		child.stderr((data) => {
			console.log('child stderr', data);
		});

		child.exit((data) => {
			console.log('child exit', data);
		});

		await child.ready();
		let cres = await child.response();
		console.log('ROOT', cres);
		child.send(`Now I'm sending a message to my child`);

		setTimeout(() => {console.log('Exit system'),mthread.exit()}, 3000);

	} catch (e) { console.log(e); mthread.disconnect(); }

}).catch(err => console.log(err));
