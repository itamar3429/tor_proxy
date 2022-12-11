const net = require("net");
const createSocket = require("../utils/CreateSocket");
// users array. need to switch to db
const users = [
	{
		username: "username",
		password: "1234",
	},
];

// tor constants
const torProxyHost = "127.0.0.1";
const torProxyPort = 9050;
const torProxyProtocol = "socks5";

const USE_TOR = process.env.USE_TOR != "FALSE";
const NO_AUTH = process.env.NO_AUTH == "TRUE";

const torProxyConfig = {
	host: torProxyHost,
	port: torProxyPort,
	protocol: torProxyProtocol,
};

// check if user authenticated return true else the socket will return 407, proxy auth required
const authMiddleware = async (socket, username, password) => {
	if (
		users.find(
			(user) => user.password == password && user.username == username
		)
	)
		return true;
	socket.end(
		"HTTP/1.1 407 Proxy Authentication Required\r\n" +
			'Proxy-Authenticate: Basic  realm="Access to the proxy server"\r\n' +
			`Date: ${new Date()}\r\n` +
			"\r\n",
		() => {}
	);
	return false;
};

/**
 *
 * @param {net.Server} server
 */
const initProxy = (server) => {
	server.on("connection", async (clientToProxySocket) => {
		try {
			clientToProxySocket.once("data", async (data) => {
				try {
					const credentialsBase64 =
						data
							.toString()
							.split("Proxy-Authorization: ")[1]
							?.split("\r\n")[0]
							.trim()
							.split(" ")[1]
							.trim() || "";

					const [username, password] = Buffer.from(
						credentialsBase64,
						"base64"
					)
						.toString("ascii")
						.split(":");

					if (
						NO_AUTH ||
						(await authMiddleware(
							clientToProxySocket,
							username,
							password
						))
					) {
						let isTLSConnection =
							data.toString().indexOf("CONNECT") !== -1;

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
							serverAddress = data
								.toString()
								.split("Host: ")[1]
								.split("\r\n")[0];
						}

						try {
							// Creating a connection from proxy to destination server
							let proxyToServerSocket = await createSocket({
								proxy: USE_TOR ? torProxyConfig : undefined,
								serverHost: serverAddress,
								serverPort,
							});

							if (isTLSConnection) {
								clientToProxySocket.write("HTTP/1.1 200 OK\r\n\r\n");
							} else {
								proxyToServerSocket.write(data);
							}

							clientToProxySocket.pipe(proxyToServerSocket);
							proxyToServerSocket.pipe(clientToProxySocket);

							proxyToServerSocket?.on("error", (err) => {
								console.log("Proxy to server error");
								console.log(err);
							});

							clientToProxySocket?.on("error", (err) => {
								console.log("Client to proxy error");
								console.log(err);
							});
						} catch (error) {
							console.log(error);
						}
					}
				} catch (error) {
					try {
						console.log(error);
						clientToProxySocket &&
							clientToProxySocket.closed == false &&
							clientToProxySocket?.end?.(
								"HTTP/1.1 500 Internal Server Error\r\n" +
									`Date: ${new Date()}\r\n` +
									`data: unexpected server error trying to connect client to proxy, try restarting tor service \r\n` +
									"\r\n"
							);
					} catch (error) {
						console.log(error);
						// console.log(error);
					}
				}
			});
		} catch (err) {
			console.log(err);
		}
	});

	server.on("error", (err) => {
		console.log("Some internal server error occurred");
		console.log(err);
	});

	server.on("close", () => {
		console.log("Client disconnected");
	});
};

module.exports = initProxy;
