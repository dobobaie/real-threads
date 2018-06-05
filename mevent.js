let listSections = {};

module.exports = (section) => {
	section = (section ? section : 'default');
	listSections[section] = (listSections[section] ? listSections[section] : {
		events: {},
		cache: null,
		called: false,
		isResolve: false,
	});

	const execEvent = (isResolve, specificKey) => (name, data) => {
		listSections[section].cache = data;
		listSections[section].called = true;
		listSections[section].isResolve = isResolve;
		listSections[section].events[name] = (listSections[section].events[name] ? listSections[section].events[name] : []);
		listSections[section].events[name] = listSections[section].events[name].filter((elem, key) => {
			if (specificKey !== undefined && specificKey !== key) {
				return elem;
			}
			if (elem.cb && elem.cb !== null && isResolve === true && !elem.onlyData) elem.cb(null, data);
			if (elem.cb && elem.cb !== null && (isResolve === false || elem.onlyData)) elem.cb(data);
			elem.resolve(data);
			return !elem.isUnique;
		});
	};

	return {
		resolve: execEvent(true),
		reject: execEvent(false),
		on: (name, cb, options) => {
			options = (options ? options : {});
			listSections[section].events[name] = (listSections[section].events[name] ? listSections[section].events[name] : []);
			return new Promise((resolve, reject) => {
				let eventId = listSections[section].events[name].push({
					cb: cb,
					resolve: resolve,
					reject: reject,
					isUnique: (typeof(options.isUnique) === 'boolean' ? options.isUnique : true),
					onlyData: (typeof(options.onlyData) === 'boolean' ? options.onlyData : false)
				}) - 1;

				if (listSections[section].called === true && options.cache === true) {
					execEvent(listSections[section].isResolve, eventId)(name, listSections[section].cache);
				}

				if (options.removeCache === true) {
					listSections[section].cache = null;
					listSections[section].called = false;
					listSections[section].isResolve = false;
				}
			});
		},
	};
};
