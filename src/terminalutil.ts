class TerminalUtil {
	static CSI = "\u001b[";

	static write(str: string) {
		process.stdout.write(str);
	}

	static PrevLine(amount: number = 1) {
		this.write(`${this.CSI}${amount}F`);
	}

	static NextLine(amount: number = 1) {
		this.write(`${this.CSI}${amount}E`);
	}

	static ClearLine() {
		this.write(`${this.CSI}0K`);
	}

	static MoveCursor(row: number, col: number) { // 1-indexed
		this.write(`${this.CSI}${row};${col}H`);
	}

	static MoveHorizontal(col: number) { // 1-indexed
		this.write(`${this.CSI}${col}G`);
	}

	static OverrideLastLine(obj: string) {
		this.PrevLine();
		this.MoveHorizontal(1);
		this.ClearLine();
		this.write(obj);
		this.NextLine();
	}
}

export default TerminalUtil;