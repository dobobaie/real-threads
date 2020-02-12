# Nthread JS
Create easily children thread (process) in NodeJs. The purpose is to delegate some part of your code in another processus.  
  
⚠ Be careful ⚠  
Don't try to make an infinite loop during the creation of the thread.  
Obviously, your server/computer will be affected by the number of threads and... cash.  

## ☁️ Installation

```
$ npm install nthread-js
```
  
## ⚙️ Examples Parent + create callback child process

``` js  
const { Parent } = require('../lib/index');
const parent = new Parent({ debug: false });

parent.listen(3000).then(async nthread => {

  console.log("[root] - Server connected");
  console.log("[root] - public uri", nthread.getPublicUri());
  console.log("[root] - local uri", nthread.getLocalUri());

  nthread.on('*', content => console.log(content));

  const child = await nthread.create(thread => {
    thread.log('[child] - is now connected with PID: ' + thread.getPid());
    
    thread.response(content => {
      console.log("[child] - response", content);
      content === "Hello" ? thread.emit('Hi back !') : thread.emit('Fine and you?');
    });
  });

  child.emit('Hello');

  // child.response(content => {
  nthread.response(({ client }, content) => {
    console.log("[root] - response", content)
    content === "Hi back !" ? child.emit('How are you ?') : null;
  });
});
```

## ⚙️ Examples Child trying to connect to the parent process

``` js  
const { Child } = require('../lib/index');
const child = new Child({ debug: true });

child.connect("http://127.0.0.1:3000").then(async thread => {
  thread.log('[child] - is now connected with PID: ' + thread.getPid());
  
  thread.emit('Hi back !');

  thread.response(content => {
    console.log("[child] - response", content);
    content === "How are you ?" ? thread.emit('Fine and you?') : null;
  });
});

```

[More examples](https://github.com/dobobaie/nthread-js/tree/master/examples)
   
## 📝 Parent usage

``` js 
const parent = new Parent({
  // options
});
```
### `Options` parameter

| Name                                                   | Type     | Description         
| ------------------------------------------------------ | -------- | ------------
| tmpFolder = '%default_tmp_folder%/nthread_generated'   | String   | Temporary folder used to save js code 
| secure = false                                         | Boolean  | Use protocol http or https
| debug = false                                          | Boolean  | Enable debug
| socket = undefined                                     | Object   | [Socket.IO API](https://socket.io/docs/server-api/)
| server = undefined                                     | Object   | [http API](https://nodejs.org/api/http.html) [https API](https://nodejs.org/api/https.html)

### `async listen(port: number = random, callback: function = undefined) : Promise<Thread>`

Establishing a socket server connection to communicate between the parent and the children process.   

### ⚙️ `Thread` usage

After the connection is established, `listen` return a `Thread` instance.    
  
| Name                                    | Return                | Description         
| ----------------------------------------| ----------------------| ------------
| async create(thread_code: function)           | Promise<ChildThread>  | Create a new Thread from a thread_code
| async load(path_file: string)                 | Promise<ChildThread>  | Create a new Thread from an import code
| async close()                                 | Undefined             | Close every ChildThreads connection
| emit(content: any)                            | Undefined             | Emit content to all the children
| async response(function: callback)            | Promise<...any>       | Callback will be called for each response doesn't matter the child
| getAllChildrenThread()                        | Array<ChildThread>    | Retrieve all the children
| getChildThreadByGuuid(guuid: string)          | ChildThread           | Retrieve a specific ChildThread by guuid
| getPublicUri()                                | String                | Retrieve public uri
| getLocalUri()                                 | String                | Retrieve local uri
| async on(event: string, callback: function)   | Promise<...any>       | Listen an event

### `on` evenements

`event` for `child_process` : `stdout`, `stderr`, `exit` and `close`  
`event` for `client` : `connected`, `disconnected`, `response` and `log`  

| Name                                    | Return                | Description         
| ----------------------------------------| ----------------------| ------------
| *                               | { event: string, guuid: string, content: any } : object 
| *_child_process_*               | { event: string, guuid: string, content: any } : object
| *_child_process_{event}         | { guuid: string, content: any } : object
| {guuid}_child_process_*         | { event: string, content: any } : object
| {guuid}_child_process_{event}   | content: any
| *_client_*                      | { event: string, guuid: string, content: any } : object
| *_client_{event}                | { guuid: string, content: any } : object
| {guuid}_client_*                | { event: string, content: any } : object
| {guuid}_client_{event}          | content: any

### ⚙️ `ChildThread` usage
  
After the thread creation, `create` or `load` return a `ChildThread` instance.  
`ChildThread` is not the child process !!! But it give you the possibility to communicate with it.   

| Name                                    | Return            | Description         
| ----------------------------------------| ------------------| ------------
| emit(content: any)                            | Undefined         | Emit content
| async response(callback: function)            | Promise<...any>   | Callback as soon the childProcess send a message
| async close()                                 | Undefined         | Close the connection
| getPid()                                      | Number            | Retrieve pid 
| getGuuid()                                    | String            | Retrieve Guuid
| async on(event: string, callback: function)   | Promise<...any>   | Listen an event

## 📝 Child usage AKA `thread_code` or `path_file`

``` js 
const child = new Child({
  // options
});
```

## `Options`

| Name                                                   | Type     | Description         
| ------------------------------------------------------ | -------- | ------------
| debug = false                                          | Boolean  | Enable debug
| socket = undefined                                     | Object   | [Socket.IO API](https://socket.io/docs/server-api/)
  
### `async connect(url: string, guuid: string = undefined) : Promise<Thread>`

Establishing a socket connection to the Parent thread.   

### ⚙️ `Thread` usage

| Name                                    | Return            | Description         
| ----------------------------------------| ------------------| ------------
| log(content: any)                             | Undefined         | Log a message directly in the parent thread
| emit(content: any)                            | Undefined         | Emit content to the parent thread
| async response(callback: function)            | Promise<...any>   | Callback as soon the childThread send a message
| async close()                                 | Undefined         | Close the connection
| getPid()                                      | Number            | Retrieve pid 
| getGuuid()                                    | String            | Retrieve Guuid
| async on(event: string, callback: function)   | Promise<...any>   | Listen an event

## ⚠️ `ChildThread` IS NOT `ChildProcess`

After created `ChildThread`, a `ChildProcess` is created.  
The `ChildProcess` is another processus within your `thread_code` or your `path_file` is executed.  
`ChildThread` is an instance from the `Parent` to communicate with the `ChildProcess`.  
With `emit` and `response`.  

## 👥 Contributing

Please help us to improve the project by contributing :)  

## ❓️ Testing

```
$ npm install
$ npm test
```
