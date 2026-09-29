import inquirer from 'inquirer';
import { FinanzasService } from '../services/FinanzasService.js';
import { reglaDecimal, reglaTextoRequerido, reglaFecha } from '../utils/prompts.js';
import { tituloMenu, exito, error } from '../utils/theme.js';

const service = new FinanzasService();

export async function menuFinanzas() {
  let salir = false;
  while (!salir) {
    tituloMenu('GESTIÓN FINANCIERA');
    const { opcion } = await inquirer.prompt([{
      type: 'list', name: 'opcion', message: 'Elige una opción:',
      choices: ['Registrar ingreso', 'Registrar egreso', 'Consultar balance', 'Volver'],
    }]);
    try {
      if (opcion === 'Registrar ingreso') await registrar('ingreso');
      if (opcion === 'Registrar egreso') await registrar('egreso');
      if (opcion === 'Consultar balance') await consultarBalance();
      if (opcion === 'Volver') salir = true;
    } catch (err) {
      error(err.message);
    }
  }
}

async function registrar(tipo) {
  const datos = await inquirer.prompt([
    { name: 'categoria', message: 'Categoría (ej. Mensualidad, Suplementos):', validate: reglaTextoRequerido('La categoría es obligatoria.', 2, 80) },
    { name: 'monto', message: 'Monto (GTQ):', validate: reglaDecimal(0.01, 1000000), filter: Number },
    { name: 'descripcion', message: 'Descripción (opcional):' },
    { name: 'cliente_id', message: 'ID de cliente (vacío si es gasto operativo):', filter: v => (v ? Number(v) : null) },
    { name: 'fecha', message: 'Fecha (YYYY-MM-DD):', default: new Date().toISOString().slice(0, 10), validate: reglaFecha() },
  ]);
  await service.registrar({ ...datos, tipo });
  exito(`${tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado.`);
}

async function consultarBalance() {
  const { desde, hasta } = await inquirer.prompt([
    { name: 'desde', message: 'Desde (YYYY-MM-DD, opcional):' },
    { name: 'hasta', message: 'Hasta (YYYY-MM-DD, opcional):' },
  ]);
  const balance = await service.balance({ desde: desde || null, hasta: hasta || null });
  console.log(`Ingresos: Q${balance.ingresos.toFixed(2)}`);
  console.log(`Egresos:  Q${balance.egresos.toFixed(2)}`);
  console.log(`Neto:     Q${balance.neto.toFixed(2)}`);
}
