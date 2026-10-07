import inquirer from 'inquirer';
import { menuClientes } from './ClienteCommands.js';
import { menuPlanes } from './PlanCommands.js';
import { menuContratos } from './ContratoCommands.js';
import { menuFinanzas } from './FinanzasCommands.js';
import { menuSeguimiento } from './SeguimientoCommands.js';
import { menuNutricion } from './NutricionCommands.js';
import { exportarClienteCommand } from './ExportarClienteCommand.js';
import { backupMenuCommand } from './BackupCommands.js';
import { tituloMenu, error, fucsia, LINEA_ESTRELLA } from '../utils/theme.js';

export async function menuPrincipal() {
  let salir = false;
  while (!salir) {
    tituloMenu('GYMCLI — MENÚ PRINCIPAL');
    const { opcion } = await inquirer.prompt([{
      type: 'list', name: 'opcion', message: 'Elige un módulo:',
      choices: ['Clientes', 'Planes', 'Contratos', 'Finanzas', 'Seguimiento', 'Nutrición', 'Exportar progreso de cliente', 'Respaldo y restauración', 'Salir'],
    }]);
    try {
      if (opcion === 'Clientes') await menuClientes();
      if (opcion === 'Planes') await menuPlanes();
      if (opcion === 'Contratos') await menuContratos();
      if (opcion === 'Finanzas') await menuFinanzas();
      if (opcion === 'Seguimiento') await menuSeguimiento();
      if (opcion === 'Nutrición') await menuNutricion();
      if (opcion === 'Exportar progreso de cliente') await exportarClienteCommand('');
      if (opcion === 'Respaldo y restauración') await backupMenuCommand();
      if (opcion === 'Salir') salir = true;
    } catch (err) {
      error(`Error inesperado: ${err.message}`);
    }
  }
  console.log(fucsia.bold(`\n${LINEA_ESTRELLA}\n   ¡Hasta luego!\n${LINEA_ESTRELLA}`));
}
