const net = require("net");

/**
 *
 * @param {net.Socket} clientToProxySocket
 * @param {Buffer} data
 */
const parseRequestInfo = (data) => {
	const credentialsBase64 =
		data
			.toString()
			.split("Proxy-Authorization: ")[1]
			?.split("\r\n")[0]
			.trim()
			.split(" ")[1]
			.trim() || "";

	const [username, password] = Buffer.from(credentialsBase64, "base64")
		.toString("ascii")
		.split(":");

	let isTLSConnection = data.toString().indexOf("CONNECT") !== -1;

	let serverPort = 80;
	let serverAddress;
	if (isTLSConnection) {
		serverPort = 443;
		serverAddress = data
			.toString()
			.split("CONNECT")[1]
			.split(" ")[1]
			.split(":")[0];
	} else {
		// console.log("data", data.toString());
		// console.log("host", data.toString().split("Host:"));
		serverAddress =
			data.toString().split("Host: ")[1]?.split("\r\n")[0].trim() || "";
	}

	return {
		username,
		password,
		serverAddress,
		serverPort,
		isTLSConnection,
	};
};

module.exports = parseRequestInfo;
