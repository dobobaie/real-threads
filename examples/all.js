const realThreads = require('../threads');
const threads = new realThreads;

// Create
threads.create('sdThread', (thread) => {
	console.log('I am sdThread');
	thread.send('hey it\'s me sdThread');
	thread.wait((thread) => {
		console.log()
	});
	
	// for (var i=0;i<=10000000000;i++);
}, 'myData');

threads.sdThread.ready((thread, data) => {
	console.log('sdThread', 'ready', data);
});

threads.sdThread.wait((thread, data) => {
	console.log('sdThread', 'wait', data);
});

// Join
const child = threads.join((thread) => {
	console.log('I am unknow');
	thread.send('hey it\'s me unknow');
	thread.wait((thread) => {

	});
	
	// for (var i=0;i<=10000000000;i++);
}, 'myData2');


// for (var i=0;i<=10000000000;i++);


// threads.complete(() => {
// 	console.log('All threads has finish');
// });

// threads.sdThread.on('msg', (data) => {
// 	console.log('Child has a data', data);
// });

// threads.sdThread.on('out', (data) => {
// 	console.log('Child has a out', data);
// });

// threads.sdThread.on('err', (data) => {
// 	console.log('Child has an error', data);
// });

// threads.sdThread.on('exit', () => {
// 	console.log('Child has finish');
// });


// child.on('msg', (data) => {
// 	console.log('Child has a data', data);
// });

// child.on('out', (data) => {
// 	console.log('Child has a out', data);
// });

// child.on('err', (data) => {
// 	console.log('Child has an error', data);
// });

// child.on('exit', () => {
// 	console.log('Child has finish');
// });
