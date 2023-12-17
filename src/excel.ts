import api from "./api.js";
import TerminalUtil from "./terminalutil.js";
import { ResultMetadata } from "./structs.js";

import xl from "excel4node";
import readline from "readline";

let API = new api("285a77fd-1257-4271-8507-f0c6b2961203");

// as of 17/12/2023 cosIng has a little less than 50 * 200 entries in their database
const pageSize = 200;
const pages = 50;

var wb = new xl.Workbook({ author: "https://github.com/RewardedIvan/cosIng-api" });
var ws = wb.addWorksheet("CosIng");
var exiting = false;

async function Save(cb: () => void = ()=>{}) {
  await API.saveCache();
  console.log(`Writing to xlsx (${c - 2 /* remove 1 leftover + header */} results)`);
  wb.write("out.xlsx", cb);
}
if (process.platform === "win32") {
  const intf = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  intf.on("SIGINT", function () {
    process.emit("SIGINT");
  });
}
process.on("SIGINT", async () => {
  exiting = true;
  await Save(() => process.exit());
});

let m: Map<string, (md: ResultMetadata) => any> = new Map();
m.set("Substance ID", (md: ResultMetadata) => { return Number(md.substanceId[0]); });
m.set("Type", (md: ResultMetadata) => { return md.itemType.join(", "); });
m.set("INCI Name", (md: ResultMetadata) => { return md.inciName.join(", "); });
m.set("URL", (md: ResultMetadata) => { return new URL(`https://ec.europa.eu/growth/tools-databases/cosing/details/${md.substanceId[0]}`); });
m.set("Chemical Description", (md: ResultMetadata) => { return md.chemicalDescription.join(", "); });
m.set("CAS #", (md: ResultMetadata) => { return md.casNo.join(", "); });
m.set("EC #", (md: ResultMetadata) => { return md.ecNo.join(", "); });
m.set("Chemical Name", (md: ResultMetadata) => { return md.chemicalName.join(", "); });
m.set("Related Regulations", (md: ResultMetadata) => { return md.relatedRegulations.join(", "); });
m.set("Other Regulations", (md: ResultMetadata) => { return md.otherRegulations.join(", "); });
m.set("Functions", (md: ResultMetadata) => { return md.functionName.join(", "); });
m.set("SCCS Opinions", (md: ResultMetadata) => { return md.sccsOpinion.join(", "); });
m.set("SCCS Opinions URLs", (md: ResultMetadata) => { return md.sccsOpinionUrls.join(", "); });
m.set("Status", (md: ResultMetadata) => { return md.status.join(", "); });
m.set("Annex / Ref #", (md: ResultMetadata) => { return (md.annexNo.length > 0) ? `${md.annexNo.join(", ")} / ${md.refNo.join(", ")}` : ''; });
m.set("Publication Date", (md: ResultMetadata) => { return (md.publicationDate != undefined && md.publicationDate.length > 0) ? new Date(md.publicationDate[0]) : "" });
m.set("Identified Ingredients or Substances IDs", (md: ResultMetadata) => { return md.identifiedIngredient.join(", "); });
//m.set("Identified Ingredients or Substances Names", (md: ResultMetadata) => { return (md.identifiedIngredient.length > 0) ? (md.identifiedIngredient.map(async (v) => (await API.getId(Number(v))).results[0].metadata.inciName)).join(", ") : ""; }); // THIS IS SO BAD, there is too many ways to do this. 1. promise ( we have to add a case to object below which will have to backtrack the switch again oh hell naw, make every function require a promise im not doing allat) 2. add an exception, hell naw this will break our architecture, 3. just do a await api.getID() hell naw if there is no cached this will be wayyyyyyyy to sloww (ughh why is it not finding metadata im not debugging this oneliner CANCELLED), TODO: possibly post-process after cache is completed
m.set("Identified Ingredients or Substances URLs", (md: ResultMetadata) => { return md.identifiedIngredient.map(v => { return `https://ec.europa.eu/growth/tools-databases/cosing/details/${v}`; }).join(", "); });
m.set("Note", (md: ResultMetadata) => { return md.note.join(", "); });

console.log("Writing headers");

let c = 1; // cursor
m.forEach((val, key) => {
  ws.cell(1, c).string(key);
  TerminalUtil.OverrideLastLine(`Writing header ${c}`);
  c++;
});
ws.cell(1, c).string(`Page (${pageSize} elements each)`); // page

TerminalUtil.OverrideLastLine(`Headers written, writing pages`);

console.log(`...`);
console.log(`...`);
c = 2;
for (let p = 1; p <= pages; p++) {
  if (exiting) break;

  TerminalUtil.OverrideLastLine(`Fetching page ${p}`);

  const pageRes = await API.getPage(p, pageSize);

  TerminalUtil.PrevLine();
  TerminalUtil.OverrideLastLine(`Page ${p}/${pages} [${(pageRes.responseTime) ? pageRes.responseTime + "ms" : "CACHED"}]`);
  TerminalUtil.NextLine();

  pageRes.results.forEach(res => {
    let c2 = 1; // cursor 2
    TerminalUtil.OverrideLastLine(`Writing result ${pageRes.results.indexOf(res) + 1}/${pageRes.results.length}`);

    if (res.metadata.substanceId == undefined) {
      TerminalUtil.OverrideLastLine(`Skipped invalid result ${pageRes.results.indexOf(res) + 1}`);
      return; // continue in a lambda
    }

    m.forEach((val, key) => {
      const out = val(res.metadata);

      switch (typeof(out)) {
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
    TerminalUtil.OverrideLastLine(`Finished page ${p}`);
    
    c++;
  });
}

await Save(() => process.exit());