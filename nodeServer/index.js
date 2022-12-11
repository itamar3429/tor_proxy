const initProxy = require("./servers/proxy");
const express = require("express");
const initApi = require("./servers/api");
const net = require("net");
const app = express();

initApi(app);

const PORT = process.env.API_PORT || 5000;
app.listen(PORT, () => console.log(`app on http://127.0.0.1:${PORT}`));

const server = net.createServer();

initProxy(server);

const PROXY_PORT = process.env.PROXY_PORT || 8080;

server.listen(
	{
		port: PROXY_PORT,
	},
	() => {
		console.log("Server listening on 127.0.0.1:" + PROXY_PORT);
	}
);
