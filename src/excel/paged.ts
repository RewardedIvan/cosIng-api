import { getPage, initializeApi, saveCache } from "../api.js";
import { ColDataType, createSheet } from "../excel.js";
import { ResultMetadata } from "../structs.js";
import * as term from "../terminalutil.js";

if (process.argv.length != 6) {
	console.log(
		`Usage: ${process.argv[0]} ${process.argv[1]} <token> <pages> <page size> <out.xlsx>`,
	);
	process.exit(1);
}

initializeApi(process.argv[2]);

const pageSize = Number(process.argv[3]);
const pages = Number(process.argv[4]);

var results: [ResultMetadata, number][] = [];

for (let p = 1; p <= pages; p++) {
	if (term.exiting) break;
	const pageRes = await getPage(p, pageSize);

	term.overrideLastLine(`Fetching page ${p}`);

	term.prevLine();
	term.overrideLastLine(
		`Page ${p}/${pages} [${pageRes.responseTime ? pageRes.responseTime + "ms" : "CACHED"}]`,
	);
	term.nextLine();

	for (const res of pageRes.results) {
		results.push([res.metadata, p]);
	}
}

await saveCache();

const extraCols = new Map<string, (md: ResultMetadata, user: number) => ColDataType>();
extraCols.set(`Page (${pageSize} results each)`, (_, user) => user);

await createSheet(process.argv[5], extraCols, results);
