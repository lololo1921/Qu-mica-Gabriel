const fs = require('fs');
const path = require('path');

const PRODUCTOS_PATH = path.join(__dirname, '..', 'datos', 'productos.json');
const STOCK_PATH = path.join(__dirname, '..', 'datos', 'stock.json');

function normalizar(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // saca acentos
    .toLowerCase()
    .trim();
}

function cargarProductos() {
  const raw = fs.readFileSync(PRODUCTOS_PATH, 'utf-8');
  return JSON.parse(raw);
}

function cargarStock() {
  if (!fs.existsSync(STOCK_PATH)) {
    return { agotados: [] };
  }
  const raw = fs.readFileSync(STOCK_PATH, 'utf-8');
  return JSON.parse(raw);
}

function guardarStock(stock) {
  fs.writeFileSync(STOCK_PATH, JSON.stringify(stock, null, 2) + '\n', 'utf-8');
}

function buscarPorNombre(productos, termino) {
  const t = normalizar(termino);
  return productos.filter((p) => normalizar(p.name).includes(t));
}

function mostrarListaNumerica(items) {
  items.forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.name}  [${item.section} / ${item.category}]`);
  });
}

function parseSeleccion(input, cantidad) {
  // acepta "1,3,4" o "1 3 4" o "todos"
  const limpio = input.trim().toLowerCase();
  if (limpio === 'todos' || limpio === 'all') {
    return Array.from({ length: cantidad }, (_, i) => i + 1);
  }
  const numeros = limpio
    .split(/[\s,]+/)
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= cantidad);
  return [...new Set(numeros)];
}

module.exports = {
  normalizar,
  cargarProductos,
  cargarStock,
  guardarStock,
  buscarPorNombre,
  mostrarListaNumerica,
  parseSeleccion,
};
