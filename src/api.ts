import FormDataBuilder from "./formdata.js";
import { SearchResults } from "./structs.js";
("./structs.js");

class api {
  root = "https://api.tech.ec.europa.eu";
  key: string;

  constructor(key: string) {
    this.key = key;
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
    let fdb = new FormDataBuilder(false, undefined);

    if (query != undefined) fdb.appendField("query", "application/json", query);
    if (sort != undefined) fdb.appendField("sort", "application/json", sort);

    console.log(fdb.getString());

    return this.post(
      `/search-api/prod/rest/search?apiKey=${this.key}&${params}`,
      fdb.getString(),
      fdb.getMimeType()
    );
  }

  getPage(nm: number): Promise<SearchResults> {
    const query = '{"bool": {"must": []}}';
    return this.search(`text=*&pageSize=2000&pageNumber=${nm}`, query, null);
  }

  getId(id: number): Promise<SearchResults> {
    const query = `{"bool": {"must": [{"term": {"substanceId": "${id}"}}]}}`;
    return this.search(`text=*&pageSize=100&pageNumber=1`, query, null);
  }
}

export default api;
