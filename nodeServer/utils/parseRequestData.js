function parseRequestData(data) {
	let method, url, headers, body;

	// Read data from the socket and parse the request data

	const lines = data.split("\n");
	const requestLine = lines.shift();
	[method, url] = requestLine.split(" ");
	headers = {};
	lines.forEach((line) => {
		const [key, value] = line.split(":");
		headers[key?.trim().toLowerCase()] = value?.trim();
	});
	body = lines.pop();
	return {
		method,
		url,
		headers,
		body,
	};
	// Return the parsed request data
}

module.exports = parseRequestData;
