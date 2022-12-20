const express = require("express");
const {
	setTorCountry,
	stopTor,
	reloadTor,
	restartTor,
	startTor,
	checkTorOk,
	torStatus,
} = require("../utils/torFunctions");
const { authUser } = require("./auth");
const { torProxyProtocol, torProxyHost, torProxyPort } = require("./proxy");

const NO_AUTH = process.env.NO_AUTH == "TRUE";

const TOR_PROXY_URL = `${torProxyProtocol}://${torProxyHost}:${torProxyPort}`;

const apiAuthMiddleware = async (req, res, next) => {
	// authorization middleware
	if (NO_AUTH) return next();

	if (!req.headers.authorization) {
		res.set("WWW-Authenticate", "Basic realm=please login your credentials");
		res.status(401).json({
			success: false,
			message: "required authentication",
		});
		return;
	}
	const AuthString = Buffer.from(
		req.headers.authorization.split(" ")[1],
		"base64"
	).toString("ascii");
	const [username, password] = AuthString.split(":");
	if (await authUser(username, password)) {
		return next();
	}
	res.status(401).json({
		success: false,
		message: "username and password not authorized",
	});
};

/**
 *
 * @param {express.Application} app
 */
const initApi = (app) => {
	app.use(apiAuthMiddleware);

	app.get("/start", async (req, res) => {
		try {
			const result = startTor();
			console.log("express app /start");
			if (result && result == "active")
				res.json({ success: true, message: "tor started" });
			else throw "tor didn't start";
		} catch (error) {
			res.json({ success: false, message: error?.message || error });
		}
	});

	app.get("/restart", async (req, res) => {
		try {
			const result = await restartTor();
			if (
				result &&
				result == "active"
				// && result.includes("starting")
			)
				res.json({ success: true, message: "tor restarted" });
			else throw "tor didn't restart";
		} catch (error) {
			res.json({ success: false, message: error?.message || error });
		}
	});
	app.get("/reload", async (req, res) => {
		try {
			const result = await reloadTor();
			if (result && result == "active")
				res.json({ success: true, message: "tor reloaded" });
			else throw "tor didn't reload";
		} catch (error) {
			res.json({ success: false, message: error?.message || error });
		}
	});

	app.get("/stop", async (req, res) => {
		try {
			const result = stopTor();
			if (result == "stopped")
				res.json({ success: true, message: "tor stopped" });
			else throw "tor didn't stop";
		} catch (error) {
			res.json({ success: false, message: error?.message || error });
		}
	});
	app.get("/status", async (req, res) => {
		try {
			const result = torStatus();
			res.json({ status: result });
		} catch (error) {
			res.json({ success: false, message: error?.message || error });
		}
	});

	app.get("/check-ok", async (req, res) => {
		try {
			const result = (await checkTorOk(TOR_PROXY_URL)).toLowerCase();
			if (result.includes("proxy_ok"))
				res.json({ success: true, message: "proxy ok" });
			else throw "problem with proxy";
		} catch (error) {
			res.json({ success: false, message: error?.message || error });
		}
	});

	app.get("/set-country/:country", async (req, res) => {
		try {
			const country = req.params.country;
			const result = await setTorCountry(country);
			if (result === "active")
				res.json({ success: true, message: "country set to " + country });
			else {
				throw "cant set to given country, tor'll default to US as country";
			}
		} catch (error) {
			try {
				await setTorCountry("US");
			} catch (error) {}
			res.json({ success: false, message: error?.message || error });
		}
	});

	app.get("*", async (req, res) => {
		res.json({
			success: false,
			message: "cannot get " + req.url,
		});
	});
};

module.exports = initApi;
