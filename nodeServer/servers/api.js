const express = require("express");
const {
	setTorCountry,
	stopTor,
	reloadTor,
	restartTor,
	startTor,
	checkTorOk,
} = require("../utils/torFunctions");
const { authUser } = require("./auth");

const NO_AUTH = process.env.NO_AUTH == "TRUE";

/**
 *
 * @param {express.Application} app
 */
const initApi = (app) => {
	app.use(async (req, res, next) => {
		// authorization middleware
		if (NO_AUTH) return next();

		if (!req.headers.authorization) {
			res.set(
				"WWW-Authenticate",
				"Basic realm=please login your credentials"
			);
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
	});

	app.get("/start", async (req, res) => {
		try {
			const result = (await startTor()).toLowerCase();
			if (result.includes("started"))
				res.json({ success: true, message: "tor started" });
			else throw "tor didn't start";
		} catch (error) {
			res.json({ success: false, message: error?.message || error });
		}
	});

	app.get("/restart", async (req, res) => {
		try {
			const result = (await restartTor()).toLowerCase();
			if (result.includes("started") && result.includes("starting"))
				res.json({ success: true, message: "tor restarted" });
			else throw "tor didn't restart";
		} catch (error) {
			res.json({ success: false, message: error?.message || error });
		}
	});
	app.get("/reload", async (req, res) => {
		try {
			const result = (await reloadTor()).toLowerCase();
			if (result?.includes?.("started") && result?.includes?.("reloading"))
				res.json({ success: true, message: "tor reloaded" });
			else throw "tor didn't reload";
		} catch (error) {
			res.json({ success: false, message: error?.message || error });
		}
	});

	app.get("/stop", async (req, res) => {
		try {
			const result = (await stopTor()).toLowerCase();
			if (result.includes("stopped"))
				res.json({ success: true, message: "tor stopped" });
			else throw "tor didn't stop";
		} catch (error) {
			res.json({ success: false, message: error?.message || error });
		}
	});

	app.get("/check-ok", async (req, res) => {
		try {
			const result = (await checkTorOk()).toLowerCase();
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
			const result = (await setTorCountry(country)).toLowerCase();
			if (result.includes("started"))
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
};

module.exports = initApi;
