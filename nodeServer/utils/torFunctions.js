const { exec } = require("child_process");

/**
 *
 * @param {string} country
 */
function setTorCountry(country) {
	return new Promise((res, rej) => {
		exec(
			`file=/etc/tor/torrc && sed -i '/^StrictNodes/d; /^ExitNodes/d' $file && echo "StrictNodes 1" >>$file && echo "ExitNodes {${country}}" >>$file
		 `,
			(err, result, stderr) => {
				if (stderr) rej(stderr);
				else if (err) rej(err);
				else res(result);
				res("no result");
			}
		);
	}).then(async (res) => res + (await restartTor()));
}

function restartTor() {
	return new Promise((res, rej) => {
		exec(
			`rc-service tor restart && rc-service tor status`,
			(err, result, stderr) => {
				if (result) res(result);
				else if (stderr) rej(stderr);
				else if (err) rej(err);
				res("no result");
			}
		);
	});
}

function stopTor() {
	return new Promise((res, rej) => {
		exec(
			`rc-service tor stop && rc-service tor status`,
			(err, result, stderr) => {
				if (result) res(result);
				else if (stderr) rej(stderr);
				else if (err) rej(err);
				res("no result");
			}
		);
	});
}

function startTor() {
	return new Promise((res, rej) => {
		exec(
			`rc-service tor start && rc-service tor status`,
			(err, result, stderr) => {
				if (result) res(result);
				else if (stderr) rej(stderr);
				else if (err) rej(err);
				res("no result");
			}
		);
	});
}

function reloadTor() {
	return new Promise((res, rej) => {
		exec(
			`rc-service tor reload && rc-service tor status`,
			(err, result, stderr) => {
				if (result) res(result);
				else if (stderr) rej(stderr);
				else if (err) rej(err);
				res("no result");
			}
		);
	});
}

function checkTorOk(torProxyStr) {
	return new Promise((res, rej) => {
		exec(
			`if [[ "$(curl ifconfig.me)" != "$(curl -x ${torProxyStr} ifconfig.me)" ]] 
			then
			echo proxy_ok
			else
			echo proxy_not_ok
			fi
			`,
			(err, result, stderr) => {
				if (result) res(result);
				else if (stderr) rej(stderr);
				else if (err) rej(err);
				res("no result");
			}
		);
	});
}
module.exports = {
	reloadTor,
	restartTor,
	stopTor,
	startTor,
	setTorCountry,
	checkTorOk,
};
