// Uso: node scripts/marcar-agotado.js
// Pregunta el nombre (o parte del nombre) de un producto y lo marca como
// "sin stock". Si hay más de una coincidencia, deja elegir varias a la vez.

const readline = require('readline/promises');
const { stdin, stdout } = require('process');
const {
  cargarProductos,
  cargarStock,
  guardarStock,
  buscarPorNombre,
  mostrarListaNumerica,
  parseSeleccion,
} = require('./_lib');

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const productos = cargarProductos();
  const stock = cargarStock();

  console.log('=== Marcar producto sin stock — Química Gabriel ===\n');

  const termino = await rl.question('¿Qué producto está fuera de stock? (nombre o parte del nombre): ');

  if (!termino.trim()) {
    console.log('No ingresaste nada. Cerrando.');
    rl.close();
    return;
  }

  const coincidencias = buscarPorNombre(productos, termino);

  if (coincidencias.length === 0) {
    console.log(`\nNo se encontró ningún producto que contenga "${termino}".`);
    rl.close();
    return;
  }

  let elegidos;

  if (coincidencias.length === 1) {
    elegidos = coincidencias;
    console.log(`\nEncontrado: ${elegidos[0].name}`);
  } else {
    console.log(`\nEncontré ${coincidencias.length} productos que coinciden con "${termino}":\n`);
    mostrarListaNumerica(coincidencias);
    const seleccion = await rl.question(
      '\nElegí uno o más números separados por coma (ej: 1,3,4), o "todos": '
    );
    const indices = parseSeleccion(seleccion, coincidencias.length);
    if (indices.length === 0) {
      console.log('No se seleccionó ningún producto válido. Cerrando.');
      rl.close();
      return;
    }
    elegidos = indices.map((i) => coincidencias[i - 1]);
  }

  let nuevos = 0;
  let yaEstaban = 0;

  elegidos.forEach((producto) => {
    if (stock.agotados.includes(producto.id)) {
      yaEstaban++;
    } else {
      stock.agotados.push(producto.id);
      nuevos++;
    }
  });

  guardarStock(stock);

  console.log('\n--- Listo ---');
  elegidos.forEach((p) => console.log(`  ✓ ${p.name} → marcado sin stock`));
  console.log(`\n${nuevos} producto(s) marcado(s) ahora. ${yaEstaban} ya estaban sin stock.`);
  console.log('El sitio va a mostrar "Sin stock" en esos productos la próxima vez que se cargue la página.');

  rl.close();
}

main();
