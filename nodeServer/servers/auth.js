const { users } = require("./users");
const axios = require("axios");
const net = require("net");

const USERS_AUTH_URL = process.env.USERS_AUTH_URL;
const EXTERNAL_AUTH = USERS_AUTH_URL && process.env.EXTERNAL_AUTH == "TRUE";
const AUTH_CREDENTIALS = process.env.USER_AUTH_CREDENTIALS;
const NO_AUTH = process.env.NO_AUTH == "TRUE";

const ADMIN_USER = process.env.PROXY_ADMIN_USER;
const ADMIN_PASS = process.env.PROXY_ADMIN_PASS;

// If specified admin user and pass than change default user (users[0]) to the following
if (ADMIN_PASS && ADMIN_USER) {
	users[0] = {
		password: ADMIN_PASS,
		username: ADMIN_USER,
	};
}

async function authUser(username, password) {
	// use the authentication of choice
	if (EXTERNAL_AUTH) {
		return authUserExternal(username, password);
	} else return authUserFromArr(username, password);
}

function authUserFromArr(username, password) {
	return !!users.find(
		(user) => user.password === password && user.username === username
	);
}

// authenticate user through custom external authentication
async function authUserExternal(username, password) {
	try {
		const res = await axios.get(USERS_AUTH_URL, {
			method: "post",
			data: JSON.stringify({
				username,
				password,
				credentials: AUTH_CREDENTIALS,
			}),
		});
		if (res.data.success) {
			return true;
		}
		return false;
	} catch (error) {
		return false;
	}
}

//
/**
 *
 * @param {net.Socket} socket
 * @param {string} username
 * @param {string} password
 *
 * check if user authenticated return true else the socket will return 407, proxy auth required
 */
const authMiddleware = async (socket, username, password) => {
	// if no auth is required return true to allow stream
	if (NO_AUTH) return true;

	// authenticate user through authentication protocols
	const authenticated = await authUser(username, password);
	if (authenticated) return true;

	// user not allowed, end connection
	socket.end(
		"HTTP/1.1 407 Proxy Authentication Required\r\n" +
			'Proxy-Authenticate: Basic  realm="Access to the proxy server"\r\n' +
			`Date: ${new Date()}\r\n` +
			"\r\n",
		() => {}
	);
	return false;
};
module.exports = { authMiddleware, authUser };
