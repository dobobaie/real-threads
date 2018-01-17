const realThreads = require('../threads');
const threads = new realThreads;

// Create
threads.create('sdThread', (thread) => {
	console.log('I am sdThread');
	thread.send('hey it\'s me sdThread');
	thread.wait((thread) => {
		console.log('wait wait wait....')
	});
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
	thread.kill();
}, 'myData2');



// threads.complete(() => {
// 	console.log('All threads has finish');
// });

threads.sdThread.on('msg', (thread, data) => {
	console.log('Child has a data', data);
});

threads.sdThread.on('out', (thread, data) => {
	console.log('Child has a out', data);
});

threads.sdThread.on('err', (thread, data) => {
	console.log('Child has an error', data);
});

threads.sdThread.on('exit', (thread) => {
	console.log('Child has finish');
});


child.on('msg', (thread, data) => {
	console.log('Child has a data', data);
});

child.on('out', (thread, data) => {
	console.log('Child has a out', data);
});

child.on('err', (thread, data) => {
	console.log('Child has an error', data);
});

child.on('exit', (thread) => {
	console.log('Child has finish');
});
