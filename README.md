# Nthread JS
Create easily children thread (process) in NodeJs. The purpose is to delegate some part of your code in another process.  
  
⚠ Be careful ⚠  
Don't try to make an infinite loop during the creation of the thread.  
Obviously, your server/computer will be affected by the number of threads and... cash.  

## ☁️ Installation

```
$ npm install nthread-js
```
  
## ⚙️ Examples

``` js  
const { Parent } = require('../lib/index');

const parent = new Parent({ debug: true });
parent.listen(3000).then(async nthread => {

  console.log("[root] - Server connected");
  console.log("[root] - public uri", nthread.getPublicUri());
  console.log("[root] - local uri", nthread.getLocalUri());

  const child = await nthread.create(thread => {
    thread.log('[child] - is now connected with PID: ' + thread.getPid());
    
    thread.response(content => {
      console.log("[child] - response", content);
      content === "Hello" ? thread.emit('Hi back !') : thread.emit('Fine and you?');
    });
  });

  child.emit('Hello');

  child.response(content => {
    console.log("[root] - response", content)
    content === "Hi back !" ? child.emit('How are you ?') : null;
  });
});
```

[More examples](https://github.com/dobobaie/nthread-js/tree/master/examples)
   
## 📝 Usage `listen(string: port = random port, object: options = undefined)`

## `Options`

| Name                                                   | Type     | Description         
| ------------------------------------------------------ | -------- | ------------
| tmpFolder = '%default_tmp_folder%/nthread_generated'   | String   | Temporary folder used to save js code 
| secure = false                                         | Boolean  | Use protocol http or https
| debug = false                                          | Boolean  | Enable debug
| port = random port                                     | Number   | Server port
| socket = undefined                                     | Object   | [Socket.IO API](https://socket.io/docs/server-api/)
| server = undefined                                     | Object   | [http API](https://nodejs.org/api/http.html) [https API](https://nodejs.org/api/https.html)

## Functions from `Nthread`
  
`Nthread` is the return of `listen` function, to create new threads and manage them.  
  
| Name                                    | Return            | Description         
| ----------------------------------------| ------------------| ------------
| getPublicUri()                          | String            | Retrieve public uri
| getLocalUri()                           | String            | Retrieve local uri
| getByGuuid()                            | Object: CThread   | Retrieve CThread by Guuid
| send(any: content)                      | Undefined         | Send a message to all threads
| response(function: callback)            | Promise: any      | Call back for each response from any threads
| createFromIO(object: Socket.Io Client)  | Promise: CThread  | Create a new thread from Socket.Io Client
| create(code: string)                    | Promise: CThread  | Create a new thread from a lambda
| load(string: file_path)                 | Promise: CThread  | Create a new thread from a file with a `module.exports = () => { ... }` inside
| close()                                 | Undefined         | Close every connection of each thread

## Functions from `CThread`
  
`CThread` is the return after the promise of `create/createFromIO/load` function, to manage the current thread and communicate with the thread from the main thread.

| Name                                    | Return            | Description         
| ----------------------------------------| ------------------| ------------
| getPid()                                | Number            | Retrieve pid of the thread
| getGuuid()                              | String            | Retrieve Guuid of CThread
| send(any: content)                      | Undefined         | Send a message to the current thread
| response(function: callback)            | Promise: any      | Call back response from the current thread
| on(string: instruction)                 | Undefined         | Retrieve evenements sent by thread process ('*', 'stdout', 'stderr', 'disconnect')
| close()                                 | Undefined         | Close the connection of the current thread

## Functions from the parameter `thread` in `create/createFromIO/load` callback

`thread` is the first parameter of the `create/createFromIO/load` callback, the code inside is running in another process, the thread. 

| Name                                    | Return            | Description         
| ----------------------------------------| ------------------| ------------
| getPid()                                | Number            | Retrieve pid of the thread
| getGuuid()                              | String            | Retrieve Guuid of CThread
| log()                                   | Undefined         | Log a message directly in the main thread
| send(any: content)                      | Undefined         | Send a message to the main thread
| response(function: callback)            | Promise: any      | Call back response from the thread
| on(string: instruction)                 | Undefined         | Retrieve evenements sent by thread process (disconnect)
| close()                                 | Undefined         | Close the connection of the thread

## 📝 Usage `connect(string: uri, object: options = undefined)`

## `Options`

| Name                                                   | Type     | Description         
| ------------------------------------------------------ | -------- | ------------
| guuid = null                                           | String   | Set a nthread-js guuid
| debug = false                                          | Boolean  | Enable debug
| socket = undefined                                     | Object   | [Socket.IO API](https://socket.io/docs/server-api/)
  
`CThread` is the return after the promise of `connect` function, to manage the thread and communicate with the main thread.

| Name                                    | Return            | Description         
| ----------------------------------------| ------------------| ------------
| getPid()                                | Number            | Retrieve pid of the thread
| getGuuid()                              | String            | Retrieve Guuid of CThread
| log()                                   | Undefined         | Log a message directly in the main thread
| send(any: content)                      | Undefined         | Send a message to the main thread
| response(function: callback)            | Promise: any      | Call back response from the thread
| on(string: instruction)                 | Undefined         | Retrieve evenements sent by thread process (disconnect)
| close()                                 | Undefined         | Close the connection of the thread
