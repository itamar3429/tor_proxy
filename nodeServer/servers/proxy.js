const net = require("net");
const createSocket = require("../utils/CreateSocket");
const { authMiddleware } = require("./auth");
const http = require("http");
const express = require("express");
const parseRequestData = require("../utils/parseRequestData");
const parseRequestInfo = require("../utils/parseRequestInfo");
// users array. need to switch to db

// tor constants
const torProxyHost = "127.0.0.1";
const torProxyPort = 9050;
const torProxyProtocol = "socks5";

const USE_TOR = process.env.USE_TOR != "FALSE";

const torProxyConfig = {
	host: torProxyHost,
	port: torProxyPort,
	protocol: torProxyProtocol,
};
/**
 *
 * @param {net.Socket} clientToProxySocket
 * @param {Buffer} data
 *
 * route the request through the proxy server and pipe the return
 */
const proxyProcess = async (clientToProxySocket, data) => {
	try {
		const { password, serverAddress, serverPort, username, isTLSConnection } =
			parseRequestInfo(data);

		if (await authMiddleware(clientToProxySocket, username, password)) {
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
						`data: unexpected server error trying to connect client to proxy\r\n` +
						"\r\n"
				);
		} catch (error) {
			console.log(error);
			// console.log(error);
		}
	}
};

/**
 *
 * @param {net.Socket} clientToProxySocket
 * @param {Buffer} data
 * @param {express.Application} app
 *
 * route the socket through the express application and send back the response
 */
const apiProcess = async (clientToProxySocket, data, app) => {
	const parsed = parseRequestData(data.toString().trim());

	const req = new http.IncomingMessage(clientToProxySocket);

	req.method = parsed.method;
	req.url = parsed.url;
	req.headers = parsed.headers;
	req.rawHeaders = data.toString();
	req.body = parsed.body;
	req.on("close", () => console.log("closed"));
	req.header = data.toString();

	const res = new http.ServerResponse(req);
	res.header = data.toString();
	res.writeHead = (statusCode, statusMessage, headers) => {
		let response = `HTTP/1.1 ${statusCode} ${statusMessage}\n\r`;
		for (let [key, value] of Object.entries(headers || {})) {
			if (key == "content-length") value = +value + 1;
			response += `${key}: ${value}\n\r`;
		}
		clientToProxySocket.write(response);
	};
	res.assignSocket(clientToProxySocket);
	res.end = (...params) => {
		res.writeHead(
			res.statusCode,
			res.statusMessage || "OK",
			res.getHeaders()
		);
		clientToProxySocket.write("\n\r" + params[0]);

		clientToProxySocket.end();
	};

	app(req, res);
};

/**
 *
 * @param {net.Server} server
 * @param {express.Application} app
 */
const initServer = (server, app) => {
	server.on("connection", async (clientToProxySocket) => {
		try {
			// when received data (request headers)
			clientToProxySocket.once("data", async (data) => {
				const dataStr = data.toString();
				if (
					// if includes connect, the request is a proxy request
					dataStr.split("/n").some((header) => header.match(/^CONNECT.*/))
				) {
					// console.log("its a proxy request");
					proxyProcess(clientToProxySocket, data);
				} else {
					// console.log("its an http request to api");
					apiProcess(clientToProxySocket, data, app);
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

module.exports = {
	initServer,
	torProxyHost,
	torProxyPort,
	torProxyProtocol,
	torProxyConfig,
};
