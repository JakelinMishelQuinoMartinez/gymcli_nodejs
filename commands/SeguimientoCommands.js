import inquirer from 'inquirer';
import { SeguimientoService } from '../services/SeguimientoService.js';
import { PlanClienteRepository } from '../repositories/PlanClienteRepository.js';
import { SeguimientoRepository } from '../repositories/SeguimientoRepository.js';
import { pedirId, reglaDecimal, reglaDecimalOpcional, reglaTextoRequerido, reglaFecha } from '../utils/prompts.js';
import { tituloMenu, subtitulo, exito, error, aviso } from '../utils/theme.js';

const service = new SeguimientoService();
const planClienteRepo = new PlanClienteRepository();
const seguimientoRepo = new SeguimientoRepository();

export async function menuSeguimiento() {
  let salir = false;
  while (!salir) {
    tituloMenu('SEGUIMIENTO FÍSICO');
    const { opcion } = await inquirer.prompt([{
      type: 'list', name: 'opcion', message: 'Elige una opción:',
      choices: ['Registrar avance', 'Ver historial de un cliente', 'Ver historial de todos los clientes', 'Eliminar registro', 'Volver'],
    }]);
    try {
      if (opcion === 'Registrar avance') await registrarAvance();
      if (opcion === 'Ver historial de un cliente') await verHistorial();
      if (opcion === 'Ver historial de todos los clientes') await verHistorialGeneral();
      if (opcion === 'Eliminar registro') await eliminarRegistro();
      if (opcion === 'Volver') salir = true;
    } catch (err) {
      error(err.message);
    }
  }
}

async function seleccionarAsignacion(mensaje) {
  const activos = await planClienteRepo.listarActivosConDetalle();
  if (!activos.length) { aviso('No hay asignaciones activas.'); return null; }
  subtitulo('Asignaciones activas (elige el ID de la columna ID)');
  console.table(activos.map(a => ({ ID: a.id, Cliente: a.cliente, Plan: a.plan })));
  return pedirId(mensaje);
}

async function registrarAvance() {
  const plan_cliente_id = await seleccionarAsignacion('ID de la asignación para este avance');
  if (plan_cliente_id === null) return;

  const existente = await planClienteRepo.buscarPorId(plan_cliente_id);
  if (!existente) return error('No existe una asignación activa con ese ID.');

  // Verifica de inmediato (antes de pedir el resto de datos) que el contrato esté firmado
  await service.validarContratoFirmado(plan_cliente_id);

  const datos = await inquirer.prompt([
    { name: 'fecha', message: 'Fecha (YYYY-MM-DD):', default: new Date().toISOString().slice(0, 10), validate: reglaFecha() },
    { name: 'peso_kg', message: 'Peso (kg):', validate: reglaDecimal(20, 300), filter: Number },
    { name: 'grasa_corporal', message: '% Grasa corporal (opcional):', validate: reglaDecimalOpcional(3, 60), filter: v => (v ? Number(v) : null) },
    { name: 'foto_ruta', message: 'Ruta de foto (opcional, relativa a /evidencias/fotos/):' },
    { name: 'notas', message: 'Notas (opcional, máx. 500 caracteres):' },
  ]);

  const medidas = [];
  let seguir = true;
  while (seguir) {
    const { agregar } = await inquirer.prompt([{ type: 'confirm', name: 'agregar', message: '¿Agregar una medida corporal (cintura, cuello, etc.)?', default: false }]);
    if (!agregar) { seguir = false; break; }
    const { nombre, valor_cm } = await inquirer.prompt([
      { name: 'nombre', message: 'Nombre de la medida (ej. Cintura, Cuello):', validate: reglaTextoRequerido('El nombre es obligatorio.', 2, 60) },
      { name: 'valor_cm', message: 'Valor (cm):', validate: reglaDecimal(0.1, 300), filter: Number },
    ]);
    medidas.push({ nombre, valor_cm });
  }

  const id = await service.registrar({ plan_cliente_id, ...datos }, medidas);
  exito(`Seguimiento registrado con id ${id}`);
}

async function verHistorial() {
  const plan_cliente_id = await seleccionarAsignacion('ID de la asignación para ver su historial');
  if (plan_cliente_id === null) return;
  const historial = await service.listarCronologico(plan_cliente_id);
  if (!historial.length) return aviso('Sin registros todavía para esta asignación.');
  console.table(historial.map(h => ({ ID: h.id, Fecha: h.fecha, Peso: h.peso_kg, Grasa: h.grasa_corporal, Estado: h.estado })));
}

async function verHistorialGeneral() {
  const historial = await seguimientoRepo.listarTodos();
  if (!historial.length) return aviso('No hay registros de seguimiento todavía.');
  console.table(historial.map(h => ({ ID: h.id, Cliente: h.cliente, Fecha: h.fecha, Peso: h.peso_kg, Grasa: h.grasa_corporal, Estado: h.estado })));
}

async function eliminarRegistro() {
  const id = await pedirId('ID del registro de seguimiento a eliminar');
  if (id === null) return;
  const registro = await seguimientoRepo.buscarPorId(id);
  if (!registro) return error('No existe un registro de seguimiento con ese ID.');

  const planCliente = await planClienteRepo.buscarPorId(registro.plan_cliente_id);
  const planActivo = planCliente?.estado === 'activo';
  const tipo = await service.eliminar(id, planActivo);
  exito(`Registro eliminado (${tipo === 'fisico' ? 'eliminación física' : 'borrado lógico'}).`);
}
