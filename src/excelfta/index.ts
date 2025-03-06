import * as XLSX from 'xlsx'
import { readFileSync } from "fs";


const buf = readFileSync("ftatest.xlsx");

const workbook = XLSX.read(buf, { type: "buffer" });
const worksheet = workbook.Sheets["Sheet 1"];

// Konverter regnearket til en array av arrays (hver rad blir en array)
const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// Iterer over radene og print kolonnene separert med space
rows.forEach((row: any[]) => {
    if(row.length === 0) return;
    console.log(row.join(" "));
});