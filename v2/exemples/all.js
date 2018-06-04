const nthread = require('../nthread')();

nthread.ready(async (mthread) =>
{
	try
	{
		console.log(mthread);
		let child = await mthread.create(async (thread) => {
			let params = thread.params;
			thread.send(`Now I'm sending child params : ${JSON.stringify(params)}`);
			let pres = await thread.response();
			console.log('CHILD', pres);
		}, 'testOne', 'testTwo');

		child.stdout((data) => {
			// console.log('child stdout', data);
			console.log(data);
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
		
		// let child2 = await mthread.connect(`${mthread.getIp()}:${mthread.getPort()}`, (thread) => {
		// 	let params = thread.getParams();
		// 	thread.send(`Now I'm sending child params : ${JSON.stringify(params)}`);
		// 	let pres = await thread.response();
		// 	console.log(pres);	
		// }, 'testConnect', 'test2Connect', ...);

		// await child2.ready();
		// let cres2 = await child2.response();
		// console.log(cres2);
		// child2.send(`Now I'm sending a message to my child2`);

	} catch (e) { console.log(e); mthread.disconnect(); }
});
