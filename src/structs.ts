export interface QueryLanguage {
	language: string;
	probability: number;
}

export interface ResultMetadata {
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
	publicationDate?: string[];
	phEurName: string[];
	es_ContentType: string[];
	otherRegulations: string[];
	classificationInformation: string[];
	functionName: string[];
	esDA_IngestDate: string[];
	currentVersion: string[];
	"corporate-search-version": string[];
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

export interface Result {
	apiVersion: string;
	reference: string;
	url: string;
	title?: string;
	contentType: string;
	language: string;
	databaseLabel: string;
	database: string;
	summary: string;
	weight: number;
	groupById?: string;
	content: string;
	accessRestriction: boolean;
	pages?: number;
	checksum: string;
	metadata: ResultMetadata;
	children: Result[];
}

export interface SearchResults {
	apiVersion: string;
	terms: string;
	responseTime: number;
	totalResults: number;
	pageNumber: number;
	pageSize: number;
	sort: string;
	groupByField?: string;
	queryLanguage: QueryLanguage;
	spellingSuggestion?: string;
	bestBets: string[];
	results: Result[];
}

export const API_VERSION = "2.138";

export interface Query {
	bool?: {
		must?: Query[];
		should?: Query[];
		must_not?: Query[];
		filter?: Query[];
	};

	text?: {
		query: string;
		fields: string[];
		defaultOperator?: "AND" | "OR";
	};

	terms?: {
		[field: string]: string[];
	};

	term?: {
		[field: string]: string | number | boolean;
	};

	match?: {
		[field: string]: string | number | boolean;
	};

	range?: {
		[field: string]: {
			gte?: number | string;
			lte?: number | string;
			gt?: number | string;
			lt?: number | string;
		};
	};
}
