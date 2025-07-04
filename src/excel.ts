import * as term from "./terminalutil.js";
import { ResultMetadata, SearchResults } from "./structs.js";

import xl from "excel4node";

export type ColDataType = string | number | Date | URL;

const cols: Map<string, (md: ResultMetadata) => ColDataType> = new Map();
cols.set("Substance ID", md => Number(md.substanceId[0]));
cols.set("Type", md => md.itemType.join(", "));
cols.set("INCI Name", md => md.inciName.join(", "));
cols.set(
	"URL",
	md =>
		new URL(`https://ec.europa.eu/growth/tools-databases/cosing/details/${md.substanceId[0]}`),
);
cols.set("Chemical Description", md => md.chemicalDescription.join(", "));
cols.set("CAS #", md => md.casNo.join(", "));
cols.set("EC #", md => md.ecNo.join(", "));
cols.set("Chemical Name", md => md.chemicalName.join(", "));
cols.set("Related Regulations", md => md.relatedRegulations.join(", "));
cols.set("Other Regulations", md => md.otherRegulations.join(", "));
cols.set("Functions", md => md.functionName.join(", "));
cols.set("SCCS Opinions", md => md.sccsOpinion.join(", "));
cols.set("SCCS Opinions URLs", md => md.sccsOpinionUrls.join(", "));
cols.set("Status", md => md.status.join(", "));
cols.set("Annex / Ref #", md =>
	md.annexNo.length > 0 ? `${md.annexNo.join(", ")} / ${md.refNo.join(", ")}` : "",
);
cols.set("Publication Date", md =>
	md.publicationDate != undefined && md.publicationDate.length > 0
		? new Date(md.publicationDate[0])
		: "",
);
cols.set("Identified Ingredients or Substances IDs", md => md.identifiedIngredient.join(", "));
cols.set("Identified Ingredients or Substances URLs", md =>
	md.identifiedIngredient
		.map(v => `https://ec.europa.eu/growth/tools-databases/cosing/details/${v}`)
		.join(", "),
);
cols.set("Note", md => md.note.join(", "));

export async function createSheet<T>(
	filename: string,
	extraCols: Map<string, (md: ResultMetadata, user: T) => ColDataType>,
	results: [ResultMetadata, T][],
) {
	const wb = new xl.Workbook({
		author: "https://github.com/RewardedIvan/cosIng-api",
	});
	const ws = wb.addWorksheet("CosIng");

	async function save() {
		console.log(`Writing to xlsx (${cy - 2 /* remove 1 leftover + header */} results)`);
		await new Promise(resolve => wb.write(filename, resolve));
	}

	term.setupSafeExit(save);

	console.log("Writing headers");

	let cy = 1,
		cx = 1; // cursors
	for (const name of [...cols.keys(), ...extraCols.keys()]) {
		ws.cell(cy, cx).string(name);
		term.overrideLastLine(`Writing header ${cy}`);
		cx++;
	}

	term.overrideLastLine(`Headers written, writing pages`);

	console.log(`...`);
	console.log(`...`);
	cy = 2;
	cx = 1;
	for (const [resIdx, [res, user]] of results.entries()) {
		if (term.exiting) break;

		term.overrideLastLine(`Writing result ${resIdx}`);

		if (res.substanceId == undefined) {
			term.overrideLastLine(`Skipped invalid result ${resIdx}`);
			continue;
		}

		for (const val of [...cols.values(), ...extraCols.values()]) {
			const out = val(res, user);

			switch (typeof out) {
				case "string":
					ws.cell(cy, cx).string(String(out));
					break;
				case "number":
					ws.cell(cy, cx).number(Number(out));
					break;
				case "object":
					switch (out.constructor.name) {
						case "URL":
							ws.cell(cy, cx).link(String(out));
							break;
						case "Date":
							ws.cell(cy, cx).date(out);
					}
				default:
					break;
			}

			cx++;
		}
		term.overrideLastLine(`Finished result ${resIdx}`);

		cx = 1;
		cy++;
	}

	await save();
}
