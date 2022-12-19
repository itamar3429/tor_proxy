const { spawn } = require("child_process");
class TorProcessManager {
	torProcess = spawn("tor");

	killTor() {
		return this.torProcess.kill();
	}

	startTor() {
		if (this.torProcess.killed) {
			this.torProcess = spawn("tor");
			return this.status();
		}
		return false;
	}

	stopTor() {
		if (!this.torProcess.killed) {
			this.torProcess.kill();
		}
		return this.status();
	}

	async restartTor() {
		this.stopTor();
		await delay(100);
		return this.startTor();
	}

	status() {
		return this.torProcess.killed ? "stopped" : "active";
	}
}

module.exports = TorProcessManager;
