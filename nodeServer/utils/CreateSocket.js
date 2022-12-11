const socks = require("socks");
const http = require("http");
const { Socket } = require("net");
const net = require("net");
/**
 *
 * @param {{serverHost:string,serverPort:number; proxy:{port:number; host:string; protocol: 'http'|'https' | 'socks5'| 'socks4'}|undefined}} param0
 * @returns {Promise<Socket>}
 */
async function createSocket({ serverHost, serverPort, proxy }) {
	if (!proxy) {
		return net.createConnection({
			port: serverPort,
			host: serverHost,
		});
	}
	if (proxy.protocol.includes("socks")) {
		const connection = socks.SocksClient.createConnection({
			proxy: {
				host: proxy.host,
				port: proxy.port,
				type: proxy.protocol == "socks5" ? 5 : 4,
			},
			command: "connect",
			destination: {
				host: serverHost,
				port: serverPort,
			},
		});
		return (
			await connection.catch((err) => {
				throw "cant connect to socks proxy socket";
			})
		).socket;
	} else {
		return new http.ClientRequest({
			agent: new http.Agent({
				port: proxy.port,
				host: proxy.host,
			}),
			host: serverHost,
			port: serverPort,
		}).socket;
	}
}

module.exports = createSocket;
