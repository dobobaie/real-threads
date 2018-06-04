let listSections = {};

module.exports = (section) => {
	section = (section ? section : 'default');
	listSections[section] = (listSections[section] ? listSections[section] : {
		events: {},
	});
	return {
		resolve: (name, data) => {
			listSections[section].events[name] = (listSections[section].events[name] ? listSections[section].events[name] : []);
			listSections[section].events[name] = listSections[section].events[name].filter((elem) => {
				if (elem.cb && !elem.onlyData) elem.cb(null, data);
				if (elem.cb && elem.onlyData) elem.cb(data);
				if (elem.retried === false) elem.resolve(data);
				elem.retried = true;
				return !elem.isUnique;
			});
		},
		reject: (name, data) => {
			listSections[section].events[name] = (listSections[section].events[name] ? listSections[section].events[name] : []);
			listSections[section].events[name] = listSections[section].events[name].filter((elem) => {
				if (elem.cb) elem.cb(data);
				if (elem.retried === false) elem.reject(data);
				elem.retried = true;
				return !elem.isUnique;
			});
		},
		on: (name, cb, options) => {
			options = (options ? options : {});
			listSections[section].events[name] = (listSections[section].events[name] ? listSections[section].events[name] : []);
			return new Promise((resolve, reject) => {
				listSections[section].events[name].push({
					retried: false,
					cb: cb,
					resolve: resolve,
					reject: reject,
					isUnique: (typeof(options.isUnique) === 'boolean' ? options.isUnique : true),
					onlyData: (typeof(options.onlyData) === 'boolean' ? options.onlyData : false)
				});
			});
		},
	};
};