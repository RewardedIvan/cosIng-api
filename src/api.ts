import { API_VERSION, Query, Result, SearchResults } from "./structs.js";
import fs from "fs";

export let API_BASE = "https://api.tech.ec.europa.eu";
export let API_KEY = "";

let pageCache = new Map<string, Result[]>();
let idCache = new Map<number, Result>();

export function initializeApi(key: string): void {
	API_KEY = key;
	loadCache();
}

export async function loadCache(): Promise<void> {
	if (!fs.existsSync(".cache")) return;

	pageCache = new Map(
		JSON.parse(await fs.promises.readFile(".cache/PageCache.json", { encoding: "utf8" })) as [
			string,
			Result[],
		][],
	);

	idCache = new Map(
		JSON.parse(await fs.promises.readFile(".cache/IDCache.json", { encoding: "utf8" })) as [
			number,
			Result,
		][],
	);
}

export async function saveCache(): Promise<void> {
	if (!fs.existsSync(".cache")) await fs.promises.mkdir(".cache");

	await fs.promises.writeFile(
		".cache/PageCache.json",
		JSON.stringify(Array.from(pageCache.entries())),
	);
	await fs.promises.writeFile(
		".cache/IDCache.json",
		JSON.stringify(Array.from(idCache.entries())),
	);
}

export async function post(endpoint: string, formData: FormData): Promise<any> {
	const req = new Request(`${API_BASE}${endpoint}`, {
		body: formData,
		method: "POST",
	});
	//console.log(await req.text());
	const res = await fetch(req);
	return await res.json();
}

export async function search(params: string, query: Query, sort: string): Promise<SearchResults> {
	let formData = new FormData();

	if (query !== undefined)
		formData.append(
			"query",
			new Blob([JSON.stringify(query)], {
				type: "application/json",
			}),
			"blob",
		);

	if (sort !== undefined)
		formData.append(
			"sort",
			new Blob([JSON.stringify(sort)], {
				type: "application/json",
			}),
			"blob",
		);

	return post(`/search-api/prod/rest/search?apiKey=${API_KEY}&${params}`, formData);
}

export async function getPage(nm: number, size: number): Promise<SearchResults> {
	const query: Query = {
		bool: {
			must: [
				{
					text: {
						query: "*",
						fields: [
							"inciName.exact",
							"inciUsaName",
							"innName.exact",
							"phEurName",
							"chemicalName",
							"chemicalDescription",
						],
						defaultOperator: "AND",
					},
				},
				{ terms: { itemType: ["ingredient", "substance"] } },
			],
		},
	};

	if (pageCache.has(`${nm},${size}`))
		return {
			apiVersion: API_VERSION,
			terms: "",
			responseTime: 0,
			totalResults: pageCache.get(`${nm},${size}`).length,
			pageNumber: nm,
			pageSize: size,
			sort: "",
			queryLanguage: { language: "en", probability: 1 },
			bestBets: [],
			results: pageCache.get(`${nm},${size}`),
		};

	//console.log("FETCHING", nm, size);

	const res = await search(`text=*&pageSize=${size}&pageNumber=${nm}`, query, null);
	pageCache.set(`${nm},${size}`, res.results);
	res.results?.forEach(e => {
		if (e.metadata.substanceId !== undefined) {
			idCache.set(Number(e.metadata.substanceId[0]), e);
		}
	});
	return res;
}

export async function getId(id: number): Promise<SearchResults> {
	const query: Query = {
		bool: {
			must: [
				{
					term: {
						substanceId: id,
					},
				},
			],
		},
	};

	if (idCache.has(id))
		return {
			apiVersion: API_VERSION,
			terms: "",
			responseTime: 0,
			totalResults: 1,
			pageNumber: 1,
			pageSize: 1,
			sort: "",
			queryLanguage: { language: "en", probability: 1 },
			bestBets: [],
			results: [idCache.get(id)],
		};

	const res = await search(`text=*&pageSize=100&pageNumber=1`, query, null);
	idCache.set(id, res.results[0]);
	return res;
}
