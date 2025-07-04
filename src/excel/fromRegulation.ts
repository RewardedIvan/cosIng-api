import xl from "excel4node";
import fs from "fs";
import * as term from "../terminalutil.js";
import { JSDOM } from "jsdom";
import { initializeApi, search } from "../api.js";
import { ResultMetadata, SearchResults } from "../structs.js";
import { ColDataType, createSheet } from "../excel.js";

if (process.argv.length != 5) {
	console.log(`Usage: ${process.argv[0]} ${process.argv[1]} <token> <regulation url> <out.xlsx>`);
	process.exit(1);
}

var ignm: [string, string][] = [];
if (!fs.existsSync(".cache/IngredientNames.json")) {
	console.log("Fetching ingredient names");
	const dom = new JSDOM(await (await fetch(process.argv[3])).text());

	dom.window.document.querySelectorAll("tr.oj-table").forEach((e, i) => {
		if (i === 0) return;
		term.overrideLastLine(`Adding ${i} ${e}`);
		ignm.push([
			e.firstElementChild?.firstElementChild?.textContent,
			e.lastElementChild?.firstElementChild?.textContent,
		]);
	});
	fs.promises.writeFile(".cache/IngredientNames.json", JSON.stringify(ignm));
} else {
	ignm = JSON.parse(
		await fs.promises.readFile(".cache/IngredientNames.json", { encoding: "utf8" }),
	);
}

initializeApi("285a77fd-1257-4271-8507-f0c6b2961203");

var results: Record<string, SearchResults> = {};
if (fs.existsSync(".cache/RegulationSearchData.json")) {
	console.log("Using cached ingredient names");
	results = JSON.parse(
		await fs.promises.readFile(".cache/RegulationSearchData.json", { encoding: "utf8" }),
	);
} else {
	var noResultsCount = 0,
		ambigiousCount = 0;
	for (const [k, name] of ignm) {
		term.overrideLastLine(`${k} ${name}`);

		if (Object.hasOwn(results, k)) {
			term.overrideLastLine(`[CACHED] ${k} ${name}`);
			continue;
		}

		results[k] = await search(
			`text=*&pageSize=10&pageNumber=1`,
			{
				bool: {
					must: [
						{
							text: {
								query: name.replace(/-|\(|\)|\/|\+|\[|\]|\:/g, "\\$&"),
								fields: ["inciName"],
								defaultOperator: "AND",
							},
						},
						{ terms: { itemType: ["ingredient", "substance"] } },
					],
				},
			},
			null,
		);

		if (results[k].results.length != 1) {
			if (results[k].results.length == 0) {
				term.overrideLastLine(`[NO RESULTS] ${k} ${name}`);
				noResultsCount++;
				//break;
			} else {
				term.overrideLastLine(`[AMBIGUOUS] ${k} ${name}`);
				ambigiousCount++;
			}
		}
	}

	await fs.promises.writeFile(".cache/RegulationSearchData.json", JSON.stringify(results));

	term.clearLine();
	console.log("No results count", noResultsCount);
	console.log("Ambigious count", ambigiousCount);
}

console.log("Filtering duplicates");

let filteredResults = new Map<string, [ResultMetadata, string]>();
for (const [entry, searchRes] of Object.entries(results)) {
	for (const [resIdx, res] of searchRes.results.entries()) {
		term.overrideLastLine(`Filtering ${entry} ${res.reference}`);
		if (filteredResults.has(res.reference)) continue;
		filteredResults.set(res.reference, [res.metadata, entry + (resIdx == 0 ? "" : "?")]);
	}
}

console.log("Writing results");

const extraCols = new Map<string, (md: ResultMetadata, user: string) => ColDataType>();
extraCols.set("Entry from the regulation", (_, user) => user);
await createSheet(process.argv[4], extraCols, [...filteredResults.values()]);
