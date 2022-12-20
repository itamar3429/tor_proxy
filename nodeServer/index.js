const { initServer } = require("./servers/proxy");
const express = require("express");
const initApi = require("./servers/api");
const net = require("net");
const http = require("http");
const app = express();

initApi(app);

const server = net.createServer();

initServer(server, app);

const PORT = process.env.PORT || 8080;
server.listen(
	{
		port: PORT,
	},
	() => {
		console.log("Server listening on 127.0.0.1:" + PORT);
	}
);
