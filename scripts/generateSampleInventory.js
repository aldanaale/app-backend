const XLSX = require("xlsx");
const path = require("path");

const rows = [
  { nombre: "Sofa", cantidad: 2 },
  { nombre: "Caja", cantidad: 10 },
  { nombre: "Tv", cantidad: 1 },
  { nombre: "Cama", cantidad: 1 },
  { nombre: "Mesa", cantidad: 1 },
];
const ws = XLSX.utils.json_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Inventario");
const outPath = path.resolve(__dirname, "..", "..", "sample_inventory.xlsx");
XLSX.writeFile(wb, outPath);
console.log(outPath);
