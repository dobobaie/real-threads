# Nthread JS
Create real thread in Node Js from a lambda, file or external app

## Install

``` bash
npm install --save nthread-js

``` 

## Usage
``` js
const nthread = require('nthread-js')( /* options */ ); // Initialize with option

nthread.ready(async (mthread) => // Waiting of the starting process [Parent in Main Thread]
{
	// create a new thread from lambda [Child in Main Thread]
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

	setTimeout(() => { console.log('Exit system'),mthread.exit() }, 3000);

}).catch(err => console.log(err));

```

[More examples](https://github.com/dobobaie/nthread-js/tree/master/examples)

## `Options` from Main Thread

| Name                      | Type     | Description         
| ------------------------- | -------- | ------------
| tmpFolder = 'generated'   | String   | Name of folder who's all temporary files is saved 
| protocol = 'http://'      | String   | Protocol
| enableSocket = true       | Boolean  | `If enable socket is false so only connect function is available in parent`
| port = random             | Number   | Port

## Functions from Parent in Main Thread

| Name                                                    | Type              | Description         
| ------------------------------------------------------- | ------------------| ------------
| ip                                                      | String            | Get public ip
| localIp                                                 | String            | Get local ip
| port                                                    | String            | Get port
| address                                                 | String            | Get local uri
| localAddress                                            | String            | Get local uro
| connect(string: uri, any: param1, ...) : Promise        | Function: Promise | Make a connection to an external thread/app
| create(function: callback, any: param1, ...) : Promise  | Function: Promise | Create a new thread from a callback
| load(string: filePath, any: param1, ...) : Promise      | Function: Promise | Create a new thread from a file
| connection(function: callback) : Promise                | Function: Promise | Wait a new external connection
| exit(number: code = 0)                                  | Function          | Close all thread and all connection


## Functions from Children in Main Thread

| Name                                     | Type              | Description         
| ---------------------------------------- | ------------------| ------------
| guid                                     | String            | Get guid of child
| params                                   | String            | Recover your initial parameters set from child thread
| send(any: data)                          | Function          | Send data to the main thread
| response(function: callback) : Promise   | Function: Promise | Wait response from the main thread
| ready(function: callback) : Promise      | Function: Promise | It's an event called after child has finished to initialised
| stdout(function: callback) : Promise     | Function: Promise | It's an event called if the thread write in process (ex: console.log)
| stderr(function: callback) : Promise     | Function: Promise | It's an event called if the thread have an error in process (ex: console.error)
| exit(function: callback) : Promise       | Function: Promise | It's an event called if the thread process has exit
| disconnect()                             | Function          | Close child connection

## Functions in Children Thread

| Name                                     | Type              | Description         
| ---------------------------------------- | ------------------| ------------
| params                                   | Array             | Recover your initial parameters sent from main thread 
| send(any: data)                          | Function          | Send data to the main thread
| response(function: callback) : Promise   | Function: Promise | Wait response from the main thread
