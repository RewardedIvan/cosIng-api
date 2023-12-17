import FormDataBuilder from "./formdata.js";
import { Result, SearchResults } from "./structs.js";
import fs from "fs";

class api {
  root = "https://api.tech.ec.europa.eu";
  key: string;

  PageCache: Map<string /* "page,size" */, Result[]> = new Map();
  IDCache: Map<number, Result> = new Map();

  constructor(key: string) {
    this.key = key;
    this.loadCache();
  }

  pageJoinIdCache() {
    this.PageCache.forEach((val, key) => {
      val.forEach(e => {
        if (e.metadata.substanceId !== undefined) // skin invalid results
          this.IDCache.set(Number(e.metadata.substanceId[0]), e)
      });
    });
  }

  async loadCache() {
    if (!fs.existsSync(".cache")) return;

    Array.from(JSON.parse(await fs.promises.readFile(".cache/PageCache.json", { encoding: "utf8" })))
    .forEach(e =>
      this.PageCache.set(e[0], e[1])
    );

    Array.from(JSON.parse(await fs.promises.readFile(".cache/IDCache.json", { encoding: "utf8" })))
    .forEach(e =>
      this.IDCache.set(e[0], e[1])
    );
  }

  async saveCache() {
    if (!fs.existsSync(".cache")) await fs.promises.mkdir(".cache");
    
    await fs.promises.writeFile(".cache/PageCache.json", JSON.stringify(Array.from(this.PageCache.entries())));
    await fs.promises.writeFile(".cache/IDCache.json"  , JSON.stringify(Array.from(this.IDCache  .entries())));
  }

  async post(url: string, body: string, contenttype: string) {
    return await (
      await fetch(`${this.root}${url}`, {
        headers: {
          "Content-Type": contenttype,
        },
        body: body,
        method: "POST",
      })
    ).json();
  }

  async search(
    params: string,
    query: string,
    sort: string
  ): Promise<SearchResults> {
    let fdb = new FormDataBuilder(true, undefined);

    if (query != undefined) fdb.appendField("query", "application/json", query);
    if (sort != undefined) fdb.appendField("sort", "application/json", sort);

    return this.post(
      `/search-api/prod/rest/search?apiKey=${this.key}&${params}`,
      fdb.getString(),
      fdb.getMimeType()
    );
  }

  async getPage(nm: number, size: number): Promise<SearchResults> {
    const query = '{"bool": {"must": []}}';

    if (this.PageCache.has(`${nm},${size}`)) return new SearchResults(this.PageCache.get(`${nm},${size}`));

    let res = await this.search(`text=*&pageSize=${size}&pageNumber=${nm}`, query, null);
    this.PageCache.set(`${nm},${size}`, res.results);
    this.pageJoinIdCache();
    return res;
  }

  async getId(id: number): Promise<SearchResults> {
    const query = `{"bool":{"must":[{"term":{"substanceId":"${id}"}}]}}`;

    if (this.IDCache.has(id)) return new SearchResults([this.IDCache.get(id)]);

    let res = await this.search(`text=*&pageSize=100&pageNumber=1`, query, null);
    this.IDCache.set(id, res.results[0]);
    return res;
  }
}

export default api;
