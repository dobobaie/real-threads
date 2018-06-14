# Nthread JS
Create real thread in Node Js

## Install

``` bash
npm install --save nthread-js

``` 

## Usage
``` js
const nthread = require('nthread-js')();

nthread.ready(async (mthread) =>
{
	try
	{
		// create a new thread
		let child = await mthread.create(async (thread) => {
			let params = thread.params;
			thread.send(`Now I'm sending child params : ${JSON.stringify(params)}`);
			let pres = await thread.response();
			console.log('CHILD', pres);
		}, 'testOne', 'testTwo');

		// Listen stdout of child
		child.stdout((data) => {
			console.log('child stdout', data);
		});

		// Process main thread
		await child.ready();
		let cres = await child.response();
		console.log('ROOT', cres);
		child.send(`Now I'm sending a message to my child`);

	} catch (e) { console.log(e); mthread.disconnect(); }

}).catch(err => console.log(err));

```

[More examples](https://github.com/dobobaie/nthread-js/tree/master/examples)
