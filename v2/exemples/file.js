const nthread = require('../nthread')();

nthread.ready(async (mthread) =>
{
	try
	{
		let child = await mthread.load(__dirname + '/file_import.js', 'testOne', 'testTwo');

		child.stdout((data) => {
			console.log('child stdout', data);
			// console.log(data);
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
		
	} catch (e) { console.log(e); mthread.disconnect(); }
});
