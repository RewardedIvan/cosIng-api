import sqlite3 from "sqlite3";
import api from "./api.js";
//import Workbook from "excel4node";

let API = new api("285a77fd-1257-4271-8507-f0c6b2961203");
let db = new sqlite3.Database("data.sqlite3");

db.exec(`CREATE TABLE IF NOT EXISTS cosIng(
  INCIName        TEXT,
  ChDescription   TEXT,
  CAS             TEXT,
  EC              TEXT,
  ChName          TEXT,
  CosmReg         TEXT,
  Functions       TEXT,
  SCCSOpinions    TEXT,
  Status          TEXT, /* active/not active */
  Checksum        TEXT, /* metadata */
  SubstanceID     TEXT  /* metadata */
);`);

let firstPage = await API.getId(29662);
let md = firstPage.results[0].metadata;

console.log(md);

console.log("");

console.log(firstPage.results.length);
console.log(md.inciName.join(", "));
console.log(md.chemicalDescription.join("; "));
console.log(md.casNo.join(", "));
console.log(md.ecNo.join(", "));
console.log(md.chemicalName.join(", "));
