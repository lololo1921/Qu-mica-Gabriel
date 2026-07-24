// Uso: node scripts/marcar-disponible.js
// Pregunta el nombre de un producto QUE YA ESTÁ MARCADO SIN STOCK
// y lo vuelve a poner disponible. Si hay más de una coincidencia entre
// los productos agotados, deja elegir varias a la vez.

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

  console.log('=== Volver a poner en stock — Química Gabriel ===\n');

  if (stock.agotados.length === 0) {
    console.log('No hay ningún producto marcado como sin stock ahora mismo. Nada para hacer.');
    rl.close();
    return;
  }

  const agotadosActuales = productos.filter((p) => stock.agotados.includes(p.id));

  const termino = await rl.question(
    '¿Qué producto volvió a tener stock? (nombre o parte del nombre): '
  );

  if (!termino.trim()) {
    console.log('No ingresaste nada. Cerrando.');
    rl.close();
    return;
  }

  const coincidencias = buscarPorNombre(agotadosActuales, termino);

  if (coincidencias.length === 0) {
    console.log(`\nNo hay ningún producto SIN STOCK que contenga "${termino}".`);
    console.log('(Puede que ese producto ya esté disponible, o que el nombre no coincida.)');
    rl.close();
    return;
  }

  let elegidos;

  if (coincidencias.length === 1) {
    elegidos = coincidencias;
    console.log(`\nEncontrado: ${elegidos[0].name}`);
  } else {
    console.log(`\nEncontré ${coincidencias.length} productos sin stock que coinciden con "${termino}":\n`);
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

  stock.agotados = stock.agotados.filter((id) => !elegidos.some((p) => p.id === id));
  guardarStock(stock);

  console.log('\n--- Listo ---');
  elegidos.forEach((p) => console.log(`  ✓ ${p.name} → disponible de nuevo`));
  console.log(`\n${elegidos.length} producto(s) vuelven a mostrarse como disponibles en el sitio.`);

  rl.close();
}

main();
