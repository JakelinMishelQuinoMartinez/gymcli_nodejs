import inquirer from 'inquirer';
import dayjs from 'dayjs';
import { ContratoService } from '../services/ContratoService.js';
import { ClienteService } from '../services/ClienteService.js';
import { PlanService } from '../services/PlanService.js';
import { PlanClienteRepository } from '../repositories/PlanClienteRepository.js';
import { ContratoRepository } from '../repositories/ContratoRepository.js';
import { pedirId, reglaDecimal } from '../utils/prompts.js';
import { tituloMenu, subtitulo, exito, error, aviso, info } from '../utils/theme.js';

const contratoService = new ContratoService();
const clienteService = new ClienteService();
const planService = new PlanService();
const planClienteRepo = new PlanClienteRepository();
const contratoRepo = new ContratoRepository();

function formatDuracion(inicio, fin) {
  const meses = dayjs(fin).diff(dayjs(inicio), 'month');
  if (meses >= 12) {
    const anios = Math.floor(meses / 12);
    const restoMeses = meses % 12;
    return restoMeses > 0 ? `${anios} año(s) y ${restoMeses} mes(es)` : `${anios} año(s)`;
  }
  return `${meses} mes(es)`;
}

export async function menuContratos() {
  let salir = false;
  while (!salir) {
    tituloMenu('CONTRATOS');
    const { opcion } = await inquirer.prompt([{
      type: 'list', name: 'opcion', message: 'Elige una opción:',
      choices: [
        'Asignar plan a cliente',
        'Listar contratos vigentes',
        'Listar asignaciones (planes_clientes)',
        'Cancelar plan',
        'Finalizar plan (por vigencia)',
        'Renovar plan',
        'Consultar contrato activo de un cliente',
        'Volver',
      ],
    }]);
    try {
      if (opcion === 'Asignar plan a cliente') await asignarPlan();
      if (opcion === 'Listar contratos vigentes') await listarContratosVigentes();
      if (opcion === 'Listar asignaciones (planes_clientes)') await listarPlanesClientes();
      if (opcion === 'Cancelar plan') await cancelarPlan();
      if (opcion === 'Finalizar plan (por vigencia)') await finalizarPlan();
      if (opcion === 'Renovar plan') await renovarPlan();
      if (opcion === 'Consultar contrato activo de un cliente') await consultarContrato();
      if (opcion === 'Volver') salir = true;
    } catch (err) {
      error(err.message);
    }
  }
}

async function asignarPlan() {
  const clientes = await clienteService.listar();
  const planes = await planService.listarActivos();
  if (!clientes.length) return aviso('No hay clientes registrados todavía. Ve primero a Clientes -> Registrar.');
  if (!planes.length) return aviso('No hay planes activos en el catálogo. Ve primero a Planes -> Crear plan.');

  const { cliente_id } = await inquirer.prompt([{
    type: 'list', name: 'cliente_id', message: 'Selecciona el cliente:',
    choices: clientes.map(c => ({ name: `#${c.id} - ${c.nombre} (${c.email})`, value: c.id })),
  }]);

  const activos = await planClienteRepo.contratosActivosDeCliente(cliente_id);
  if (activos.length) {
    aviso(`Este cliente ya tiene ${activos.length} plan(es) activo(s): ${activos.map(a => a.plan).join(', ')}.`);
    const { continuar } = await inquirer.prompt([{ type: 'confirm', name: 'continuar', message: '¿Deseas asignarle un plan adicional de todos modos?' }]);
    if (!continuar) return info('Operación cancelada.');
  }

  const { plan_id } = await inquirer.prompt([{
    type: 'list', name: 'plan_id', message: 'Selecciona el plan:',
    choices: planes.map(p => ({ name: `${p.nombre} - ${p.nivel} (${p.duracion_meses} meses, Q${p.precio})`, value: p.id })),
  }]);

  const { planClienteId, contratoId } = await contratoService.asignarPlan(cliente_id, plan_id);
  exito(`Plan asignado. ID de asignación: ${planClienteId} | ID de contrato: ${contratoId}`);

  const { firmar } = await inquirer.prompt([{ type: 'confirm', name: 'firmar', message: '¿Firmar el contrato ahora?' }]);
  if (firmar) {
    await contratoService.firmarContrato(contratoId);
    exito('Contrato firmado.');
  } else {
    aviso('Contrato sin firmar: no podrás registrar seguimiento ni nutrición hasta que lo firmes.');
  }
}

async function listarContratosVigentes() {
  const contratos = await contratoRepo.listarActivos();
  if (!contratos.length) return aviso('No hay contratos vigentes.');
  console.table(contratos.map(c => ({
    'ID Contrato': c.contrato_id,
    'ID Asignación': c.plan_cliente_id,
    Cliente: c.cliente,
    Plan: c.plan,
    Duración: formatDuracion(c.fecha_inicio, c.fecha_fin),
    'Vence el': c.fecha_fin,
    Precio: `Q${c.precio}`,
    Firmado: c.firmado ? 'Sí' : 'No',
  })));
}

async function listarPlanesClientes() {
  const filas = await planClienteRepo.listarTodosConDetalle();
  if (!filas.length) return aviso('No hay asignaciones registradas.');
  console.table(filas.map(f => ({
    ID: f.id, Cliente: f.cliente, Plan: f.plan, Inicio: f.fecha_inicio, Fin: f.fecha_fin, Estado: f.estado,
  })));
}

async function seleccionarAsignacionActiva(mensaje) {
  const activos = await planClienteRepo.listarActivosConDetalle();
  if (!activos.length) { aviso('No hay asignaciones activas en este momento.'); return null; }
  subtitulo('Asignaciones activas (elige el ID de la columna ID)');
  console.table(activos.map(a => ({ ID: a.id, Cliente: a.cliente, Plan: a.plan, 'Vence el': a.fecha_fin })));
  return pedirId(mensaje);
}

async function cancelarPlan() {
  const plan_cliente_id = await seleccionarAsignacionActiva('ID de la asignación a cancelar');
  if (plan_cliente_id === null) return;
  const existente = await planClienteRepo.buscarPorId(plan_cliente_id);
  if (!existente) return error('No existe una asignación activa con ese ID.');

  const { confirmar } = await inquirer.prompt([{ type: 'confirm', name: 'confirmar', message: '¿Confirmas la cancelación?' }]);
  if (!confirmar) return info('Operación cancelada.');

  const { registrarDevolucion } = await inquirer.prompt([{ type: 'confirm', name: 'registrarDevolucion', message: '¿Registrar un egreso por devolución?', default: false }]);
  let devolucion = null;
  if (registrarDevolucion) {
    const { monto } = await inquirer.prompt([{ name: 'monto', message: 'Monto a devolver (GTQ):', validate: reglaDecimal(0.01, 1000000), filter: Number }]);
    devolucion = { monto, cliente_id: existente.cliente_id };
  }

  const resultado = await contratoService.cancelar(plan_cliente_id, devolucion);
  exito(`Plan cancelado. Cascada aplicada a seguimiento/nutrición: ${resultado.conCascada ? 'sí' : 'no'}.`);
}

async function finalizarPlan() {
  const plan_cliente_id = await seleccionarAsignacionActiva('ID de la asignación a finalizar');
  if (plan_cliente_id === null) return;
  const existente = await planClienteRepo.buscarPorId(plan_cliente_id);
  if (!existente) return error('No existe una asignación activa con ese ID.');
  await contratoService.finalizar(plan_cliente_id);
  exito('Plan finalizado.');
}

async function renovarPlan() {
  const plan_cliente_id = await seleccionarAsignacionActiva('ID de la asignación a renovar');
  if (plan_cliente_id === null) return;
  const existente = await planClienteRepo.buscarPorId(plan_cliente_id);
  if (!existente) return error('No existe una asignación activa con ese ID.');
  const resultado = await contratoService.renovar(plan_cliente_id);
  exito(`Plan renovado. Nueva fecha de fin: ${resultado.nuevaFechaFin}`);
}

async function consultarContrato() {
  const { valor } = await inquirer.prompt([{
    name: 'valor', message: 'ID o correo del cliente:',
    validate: v => (String(v).trim() ? true : 'Este campo es obligatorio.'),
  }]);
  const datos = await planClienteRepo.contratoActivoDeCliente(valor);
  if (!datos) return aviso('Este cliente no tiene un contrato activo.');
  console.table([{
    Cliente: datos.cliente_nombre, Plan: datos.plan_nombre, Inicio: datos.ct_inicio,
    Fin: datos.ct_fin, Precio: `Q${datos.precio}`, Firmado: datos.firmado ? 'Sí' : 'No',
  }]);
}
