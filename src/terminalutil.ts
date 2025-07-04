import readline from "readline";

const CSI = "\u001b[";

export let exiting = false;
export function setupSafeExit(onExit: () => Promise<void>) {
	if (process.platform === "win32") {
		const intf = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		intf.on("SIGINT", function () {
			process.emit("SIGINT");
		});
	}

	process.on("SIGINT", async () => {
		exiting = true;
		await onExit();
	});
}

export function write(str: string) {
	//console.log("writing", JSON.stringify(str));
	process.stdout.write(str);
}

export function prevLine(amount: number = 1) {
	write(`${CSI}${amount}F`);
}

export function nextLine(amount: number = 1) {
	write(`${CSI}${amount}E`);
}

export function clearLine() {
	write(`${CSI}0K`);
}

export function moveCursor(row: number, col: number) {
	// 1-indexed
	write(`${CSI}${row};${col}H`);
}

export function moveHorizontal(col: number) {
	// 1-indexed
	write(`${CSI}${col}G`);
}

export function overrideLastLine(obj: string) {
	prevLine();
	moveHorizontal(1);
	clearLine();
	write(obj);
	nextLine();
}
