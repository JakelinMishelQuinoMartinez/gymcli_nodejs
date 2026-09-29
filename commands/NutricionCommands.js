import inquirer from 'inquirer';
import { NutricionService } from '../services/NutricionService.js';
import { NutricionRepository } from '../repositories/NutricionRepository.js';
import { PlanClienteRepository } from '../repositories/PlanClienteRepository.js';
import { pedirId, reglaTextoRequerido, reglaEntero, reglaFecha } from '../utils/prompts.js';
import { tituloMenu, subtitulo, exito, error, aviso } from '../utils/theme.js';

const service = new NutricionService();
const nutricionRepo = new NutricionRepository();
const planClienteRepo = new PlanClienteRepository();

export async function menuNutricion() {
  let salir = false;
  while (!salir) {
    tituloMenu('NUTRICIÓN');
    const { opcion } = await inquirer.prompt([{
      type: 'list', name: 'opcion', message: 'Elige una opción:',
      choices: ['Crear plan nutricional', 'Registrar alimento', 'Reporte semanal', 'Volver'],
    }]);
    try {
      if (opcion === 'Crear plan nutricional') await crearPlan();
      if (opcion === 'Registrar alimento') await registrarAlimento();
      if (opcion === 'Reporte semanal') await reporteSemanal();
      if (opcion === 'Volver') salir = true;
    } catch (err) {
      error(err.message);
    }
  }
}

async function crearPlan() {
  const activos = await planClienteRepo.listarActivosConDetalle();
  if (!activos.length) return aviso('No hay asignaciones activas.');
  subtitulo('Asignaciones activas (elige el ID de la columna ID)');
  console.table(activos.map(a => ({ ID: a.id, Cliente: a.cliente, Plan: a.plan })));

  const plan_cliente_id = await pedirId('ID de la asignación para este plan nutricional');
  if (plan_cliente_id === null) return;

  const datos = await inquirer.prompt([
    { name: 'nombre', message: 'Nombre del plan nutricional:', validate: reglaTextoRequerido('El nombre es obligatorio.', 2, 120) },
    { name: 'meta_calorica_diaria', message: 'Meta calórica diaria (kcal):', validate: reglaEntero(1000, 5000), filter: Number },
    { name: 'descripcion', message: 'Descripción (opcional):' },
  ]);
  const plan = await service.crearPlan({ plan_cliente_id, ...datos });
  exito(`Plan nutricional creado con id ${plan.id}`);
}

async function registrarAlimento() {
  const planes = await nutricionRepo.listarPlanesConDetalle();
  if (!planes.length) return aviso('No hay planes nutricionales registrados.');
  subtitulo('Planes nutricionales (elige el ID de la columna ID)');
  console.table(planes.map(p => ({ ID: p.id, Cliente: p.cliente, Nombre: p.nombre, Estado: p.estado })));

  const plan_nutricional_id = await pedirId('ID del plan nutricional');
  if (plan_nutricional_id === null) return;

  const datos = await inquirer.prompt([
    { name: 'fecha', message: 'Fecha (YYYY-MM-DD):', default: new Date().toISOString().slice(0, 10), validate: reglaFecha() },
    { name: 'nombre', message: 'Alimento:', validate: reglaTextoRequerido('El nombre del alimento es obligatorio.', 2, 120) },
    { name: 'calorias', message: 'Calorías:', validate: reglaEntero(1, 5000), filter: Number },
    { type: 'list', name: 'momento', message: 'Momento:', choices: ['desayuno', 'almuerzo', 'cena', 'snack'] },
  ]);
  await service.registrarAlimento({ plan_nutricional_id, ...datos });
  exito('Alimento registrado.');
}

async function reporteSemanal() {
  const planes = await nutricionRepo.listarPlanesConDetalle();
  if (!planes.length) return aviso('No hay planes nutricionales registrados.');
  subtitulo('Planes nutricionales (elige el ID de la columna ID)');
  console.table(planes.map(p => ({ ID: p.id, Cliente: p.cliente, Nombre: p.nombre })));

  const plan_nutricional_id = await pedirId('ID del plan nutricional');
  if (plan_nutricional_id === null) return;

  const { desde, hasta } = await inquirer.prompt([
    { name: 'desde', message: 'Desde (YYYY-MM-DD):', validate: reglaFecha() },
    { name: 'hasta', message: 'Hasta (YYYY-MM-DD):', validate: reglaFecha() },
  ]);
  const reporte = await service.reporteSemanal(plan_nutricional_id, desde, hasta);
  if (!reporte.dias.length) return aviso('No hay alimentos registrados en ese rango.');
  console.table(reporte.dias);
  console.log(`Total: ${reporte.total} kcal | Promedio diario: ${reporte.promedio.toFixed(0)} kcal`);
}
