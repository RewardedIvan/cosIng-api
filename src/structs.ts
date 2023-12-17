import nil from "./nil.js";

class QueryLanguage {
	language: string;
	probability: number;
}

class ResultMetadata {
	nameOfCommonIngredientsGlossary: string[];
	otherRestrictions: string[];
	note: string[];
	refNo: string[];
	sccsOpinionUrls: string[];
	innName: string[];
	other: string[];
	itemType: string[];
	chemicalName: string[];
	sccsOpinion: string[];
	refNo_letter: string[];
	language: string[];
	chemicalDescription: string[];
	esST_checksum: string[];
	reference: string[];
	cosmeticRestriction: string[];
	ecNo: string[];
	maximumConcentration: string[];
	identifiedIngredient: string[];
	officialJournalPublication: string[];
	inciName: string[];
	esST_FileName: string[];
	casNo: string[];
	substanceId: string[];
	DATASOURCE: string[];
	annexNo: string[];
	productTypeBodyParts: string[];
	publicationDate: nil<string[]>;
	phEurName: string[];
	es_ContentType: string[];
	otherRegulations: string[];
	classificationInformation: string[];
	functionName: string[];
	esDA_IngestDate: string[];
	currentVersion: string[];
	'corporate-search-version': string[];
	url: string[];
	esST_URL: string[];
	esDA_QueueDate: string[];
	refNo_digit: string[];
	colour: string[];
	datasource: string[];
	wordingOfConditions: string[];
	inciUsaName: string[];
	relatedRegulations: string[];
	perfuming: string[];
	status: string[];
}

class Result {
	apiVersion: string;
	reference: string;
	url: string;
	title: nil<string>;
	contentType: string;
	language: string;
	databaseLabel: string;
	database: string;
	summary: string;
	weight: number;
	groupById: nil<string>;
	content: string;
	accessRestriction: boolean;
	pages: nil<number>;
	checksum: string;
	metadata: ResultMetadata;
	children: Result[];
}

class SearchResults {
	apiVersion: string;
	terms: string;
	responseTime: number;
	totalResults: number;
	pageNumber: number;
	pageSize: number;
	sort: string;
	groupByField: nil<string>;
	queryLanguage: QueryLanguage;
	spellingSuggestion: nil<string>;
	bestBets: string[];
	results: Result[];

	constructor(results: Result[]) {
		this.results = results;
	}

	checkApiVersion(): boolean {
		return this.apiVersion == "2.115";
	}
}

export { SearchResults, QueryLanguage, Result, ResultMetadata };
