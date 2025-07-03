const CSI = "\u001b[";

export function write(str: string) {
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
