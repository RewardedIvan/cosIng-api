import { getPage, initializeApi, saveCache } from "./api.js";
import * as term from "./terminalutil.js";
import { ResultMetadata } from "./structs.js";

import xl from "excel4node";
import readline from "readline";

const pageSize = 200;
const pages = 100;

initializeApi("285a77fd-1257-4271-8507-f0c6b2961203");

const wb = new xl.Workbook({
	author: "https://github.com/RewardedIvan/cosIng-api",
});
const ws = wb.addWorksheet("CosIng");
let exiting = false;

async function Save(cb: () => void = () => {}) {
	await saveCache();
	console.log(`Writing to xlsx (${c - 2 /* remove 1 leftover + header */} results)`);
	wb.write("out.xlsx", cb);
}

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
	await Save(() => process.exit());
});

const m: Map<string, (md: ResultMetadata) => any> = new Map();
m.set("Substance ID", (md: ResultMetadata) => Number(md.substanceId[0]));
m.set("Type", (md: ResultMetadata) => md.itemType.join(", "));
m.set("INCI Name", (md: ResultMetadata) => md.inciName.join(", "));
m.set(
	"URL",
	(md: ResultMetadata) =>
		new URL(`https://ec.europa.eu/growth/tools-databases/cosing/details/${md.substanceId[0]}`),
);
m.set("Chemical Description", (md: ResultMetadata) => md.chemicalDescription.join(", "));
m.set("CAS #", (md: ResultMetadata) => md.casNo.join(", "));
m.set("EC #", (md: ResultMetadata) => md.ecNo.join(", "));
m.set("Chemical Name", (md: ResultMetadata) => md.chemicalName.join(", "));
m.set("Related Regulations", (md: ResultMetadata) => md.relatedRegulations.join(", "));
m.set("Other Regulations", (md: ResultMetadata) => md.otherRegulations.join(", "));
m.set("Functions", (md: ResultMetadata) => md.functionName.join(", "));
m.set("SCCS Opinions", (md: ResultMetadata) => md.sccsOpinion.join(", "));
m.set("SCCS Opinions URLs", (md: ResultMetadata) => md.sccsOpinionUrls.join(", "));
m.set("Status", (md: ResultMetadata) => md.status.join(", "));
m.set("Annex / Ref #", (md: ResultMetadata) =>
	md.annexNo.length > 0 ? `${md.annexNo.join(", ")} / ${md.refNo.join(", ")}` : "",
);
m.set("Publication Date", (md: ResultMetadata) =>
	md.publicationDate != undefined && md.publicationDate.length > 0
		? new Date(md.publicationDate[0])
		: "",
);
m.set("Identified Ingredients or Substances IDs", (md: ResultMetadata) =>
	md.identifiedIngredient.join(", "),
);
m.set("Identified Ingredients or Substances URLs", (md: ResultMetadata) =>
	md.identifiedIngredient
		.map(v => `https://ec.europa.eu/growth/tools-databases/cosing/details/${v}`)
		.join(", "),
);
m.set("Note", (md: ResultMetadata) => md.note.join(", "));

console.log("Writing headers");

let c = 1; // cursor
m.forEach((val, key) => {
	ws.cell(1, c).string(key);
	term.overrideLastLine(`Writing header ${c}`);
	c++;
});
ws.cell(1, c).string(`Page (${pageSize} elements each)`); // page

term.overrideLastLine(`Headers written, writing pages`);

console.log(`...`);
console.log(`...`);
c = 2;
for (let p = 1; p <= pages; p++) {
	if (exiting) break;

	term.overrideLastLine(`Fetching page ${p}`);

	const pageRes = await getPage(p, pageSize);

	term.prevLine();
	term.overrideLastLine(
		`Page ${p}/${pages} [${pageRes.responseTime ? pageRes.responseTime + "ms" : "CACHED"}]`,
	);
	term.nextLine();

	pageRes.results.forEach(res => {
		let c2 = 1; // cursor 2
		term.overrideLastLine(
			`Writing result ${pageRes.results.indexOf(res) + 1}/${pageRes.results.length}`,
		);

		if (res.metadata.substanceId == undefined) {
			term.overrideLastLine(`Skipped invalid result ${pageRes.results.indexOf(res) + 1}`);
			return; // continue in a lambda
		}

		m.forEach((val, key) => {
			const out = val(res.metadata);

			switch (typeof out) {
				case "string":
					ws.cell(c, c2).string(String(out));
					break;
				case "number":
					ws.cell(c, c2).number(Number(out));
					break;
				case "object":
					switch (out.constructor.name) {
						case "URL":
							ws.cell(c, c2).link(String(out));
							break;
						case "Date":
							ws.cell(c, c2).date(out);
					}
				default:
					break;
			}

			c2++;
		});
		ws.cell(c, c2).number(p); // page
		term.overrideLastLine(`Finished page ${p}`);

		c++;
	});
}

await Save(() => process.exit());
