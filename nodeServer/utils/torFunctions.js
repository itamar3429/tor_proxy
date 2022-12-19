const { exec, spawn } = require("child_process");
const delay = require("./delay");
const TorProcessManager = require("./TorProcessManager");

const torProcess = new TorProcessManager();

/**
 *
 * @param {string} country
 */
async function setTorCountry(country) {
	const res = await new Promise((res, rej) => {
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
	});
	return await torProcess.restartTor();
}

async function restartTor() {
	const res = await torProcess.restartTor();
	return res;
}

function stopTor() {
	return torProcess.stopTor();
}

function startTor() {
	return torProcess.startTor();
}

function reloadTor() {
	return torProcess.restartTor();
}

function torStatus() {
	return torProcess.status();
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
	torStatus,
};
