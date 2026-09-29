import inquirer from 'inquirer';
import { PlanService } from '../services/PlanService.js';
import { pedirId, reglaTextoRequerido, reglaEntero, reglaDecimal } from '../utils/prompts.js';
import { tituloMenu, exito, error } from '../utils/theme.js';

const service = new PlanService();
const NIVELES = ['principiante', 'intermedio', 'avanzado'];

export async function menuPlanes() {
  let salir = false;
  while (!salir) {
    tituloMenu('PLANES DE ENTRENAMIENTO');
    const { opcion } = await inquirer.prompt([{
      type: 'list', name: 'opcion', message: 'Elige una opción:',
      choices: ['Crear plan', 'Listar planes (filtrar por nivel)', 'Actualizar plan', 'Eliminar plan', 'Volver'],
    }]);
    try {
      if (opcion === 'Crear plan') await crearPlan();
      if (opcion === 'Listar planes (filtrar por nivel)') await listarPlanes();
      if (opcion === 'Actualizar plan') await actualizarPlan();
      if (opcion === 'Eliminar plan') await eliminarPlan();
      if (opcion === 'Volver') salir = true;
    } catch (err) {
      error(err.message);
    }
  }
}

async function crearPlan() {
  const datos = await inquirer.prompt([
    { name: 'nombre', message: 'Nombre del plan:', validate: reglaTextoRequerido('El nombre es obligatorio.', 2, 120) },
    { name: 'duracion_meses', message: 'Duración (meses, 1-24):', validate: reglaEntero(1, 24), filter: Number },
    { name: 'meta_fisica', message: 'Meta física:', validate: reglaTextoRequerido('La meta física es obligatoria.', 2, 255) },
    { type: 'list', name: 'nivel', message: 'Nivel:', choices: NIVELES },
    { name: 'precio', message: 'Precio (GTQ):', validate: reglaDecimal(0.01, 100000), filter: Number },
  ]);
  const plan = await service.crear(datos);
  exito(`Plan creado con id ${plan.id}`);
}

async function listarPlanes() {
  const { filtrar } = await inquirer.prompt([{ type: 'confirm', name: 'filtrar', message: '¿Filtrar por nivel?', default: false }]);
  let nivel = null;
  if (filtrar) {
    ({ nivel } = await inquirer.prompt([{ type: 'list', name: 'nivel', message: 'Nivel:', choices: NIVELES }]));
  }
  const planes = await service.listarActivos(nivel);
  if (!planes.length) return console.log('No hay planes que coincidan.');
  console.table(planes.map(p => ({
    ID: p.id, Nombre: p.nombre, Nivel: p.nivel, Meses: p.duracion_meses,
    'Meta física': p.meta_fisica, Precio: `Q${p.precio}`, Estado: p.estado,
  })));
}

async function actualizarPlan() {
  const id = await pedirId('ID del plan a actualizar');
  if (id === null) return;
  const existente = await service.buscarPorId(id);
  if (!existente) return error('Plan no encontrado. Verifica el ID con "Listar planes".');

  console.log(`\nDatos actuales de #${existente.id}:`);
  console.log(`  Nombre:      ${existente.nombre}`);
  console.log(`  Duración:    ${existente.duracion_meses} meses`);
  console.log(`  Meta física: ${existente.meta_fisica}`);
  console.log(`  Nivel:       ${existente.nivel}`);
  console.log(`  Precio:      Q${existente.precio}`);
  console.log('\nPresiona ENTER en cualquier campo para dejarlo tal cual está.\n');

  const nuevo = await inquirer.prompt([
    { name: 'nombre', message: 'Nuevo nombre:', default: existente.nombre, validate: reglaTextoRequerido('Nombre inválido.', 2, 120) },
    { name: 'duracion_meses', message: 'Nueva duración (meses):', default: String(existente.duracion_meses), validate: reglaEntero(1, 24), filter: Number },
    { name: 'meta_fisica', message: 'Nueva meta física:', default: existente.meta_fisica, validate: reglaTextoRequerido('Meta física inválida.', 2, 255) },
    { type: 'list', name: 'nivel', message: 'Nivel:', default: existente.nivel, choices: NIVELES },
    { name: 'precio', message: 'Nuevo precio (GTQ):', default: String(existente.precio), validate: reglaDecimal(0.01, 100000), filter: Number },
  ]);
  await service.actualizar(id, nuevo);
  exito('Plan actualizado.');
}

async function eliminarPlan() {
  const id = await pedirId('ID del plan a eliminar');
  if (id === null) return;
  const existente = await service.buscarPorId(id);
  if (!existente) return error('Plan no encontrado. Verifica el ID con "Listar planes".');

  const { confirmar } = await inquirer.prompt([{ type: 'confirm', name: 'confirmar', message: `¿Confirmas desactivar "${existente.nombre}" del catálogo?` }]);
  if (!confirmar) return console.log('Operación cancelada.');

  await service.eliminar(id);
  exito('Plan desactivado. Ya no aparecerá disponible para nuevas asignaciones (los clientes que ya lo tienen no se ven afectados).');
}
