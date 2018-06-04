async (thread) => {
	let params = thread.params;
	thread.send(`Now I'm sending child params : ${JSON.stringify(params)}`);
	let pres = await thread.response();
	console.log('CHILD', pres);
}