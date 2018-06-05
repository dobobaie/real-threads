let listSections = {};

module.exports = (section) => {
	section = (section ? section : 'default');
	listSections[section] = (listSections[section] ? listSections[section] : {
		events: {},
	});

	const execEvent = (isResolve, specificKey) => (name, data) => {
		listSections[section].events[name] = (listSections[section].events[name] ? listSections[section].events[name] : {
			cache: null,
			called: false,
			isResolve: false,
			stack: [],
		});
		listSections[section].cache = data;
		listSections[section].called = true;
		listSections[section].isResolve = isResolve;
		listSections[section].events[name].stack = listSections[section].events[name].stack.filter((elem, key) => {
			if (specificKey !== undefined && specificKey !== key) return elem;
			if (elem.cb && elem.cb !== null && isResolve === true && !elem.onlyData) elem.cb(null, data);
			if (elem.cb && elem.cb !== null && ((!elem.onlyData && isResolve === false) || (isResolve === true && elem.onlyData))) elem.cb(data);
			if (elem.promise === true) (listSections[section].isResolve ? elem.resolve(data) : elem.reject(data));
			return !elem.isUnique;
		});
	};

	return {
		resolve: execEvent(true),
		reject: execEvent(false),
		on: (name, cb, options) => {
			options = (options ? options : {});
			listSections[section].events[name] = (listSections[section].events[name] ? listSections[section].events[name] : {
				cache: null,
				called: false,
				isResolve: false,
				stack: [],
			});
			return new Promise((resolve, reject) => {
				let eventId = listSections[section].events[name].stack.push({
					cb: cb,
					resolve: resolve,
					reject: reject,
					isUnique: (typeof(options.isUnique) === 'boolean' ? options.isUnique : true),
					onlyData: (typeof(options.onlyData) === 'boolean' ? options.onlyData : false),
					promise: (typeof(options.promise) === 'boolean' ? options.promise : false),
				}) - 1;

				if (listSections[section].events[name].called === true && options.cache === true) {
					console.log('toto');
					execEvent(listSections[section].events[name].isResolve, eventId)(name, listSections[section].events[name].cache);
				}

				if (options.removeCache === true) {
					listSections[section].events[name].cache = null;
					listSections[section].events[name].called = false;
					listSections[section].events[name].isResolve = false;
				}
			});
		},
	};
};
