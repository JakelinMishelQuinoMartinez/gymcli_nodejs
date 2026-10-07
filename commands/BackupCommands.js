import inquirer from 'inquirer';
import { TABLES, createBackup, inspectBackup, restoreBackup } from '../services/BackupService.js';

export async function backupCommand(args = []) {
  let selected = TABLES;
  const tablesArg = args.find((arg) => arg.startsWith('--tables='));
  if (tablesArg) selected = tablesArg.slice('--tables='.length).split(',').map((name) => name.trim()).filter(Boolean);
  else if (args.includes('--select')) {
    const { tables } = await inquirer.prompt([{
      type: 'checkbox', name: 'tables', message: 'Elige las colecciones del respaldo:',
      choices: [...TABLES, 'Volver al menú principal'],
    }]);
    if (!tables.length || tables.includes('Volver al menú principal')) {
      console.log('Respaldo cancelado.');
      return;
    }
    selected = tables;
  }
  const file = await createBackup(selected);
  console.log(`Respaldo creado: ${file}`);
}

export async function restoreCommand(args = []) {
  let file = args.find((arg) => !arg.startsWith('--'));
  if (!file) {
    const answer = await inquirer.prompt([{
      type: 'input', name: 'file', message: 'Ruta del respaldo (Enter para cancelar):',
    }]);
    file = answer.file.trim();
  }
  if (!file) {
    console.log('Restauración cancelada.');
    return;
  }
  const backup = await inspectBackup(file);
  if (backup.tables.length !== TABLES.length || TABLES.some((table) => !backup.tables.includes(table))) {
    throw new Error('Por seguridad, restore requiere un respaldo completo con todas las colecciones; no se modificaron datos.');
  }
  const { confirm } = await inquirer.prompt([{
    type: 'confirm', name: 'confirm', default: false,
    message: 'Esto sobrescribirá los datos. ¿Continuar?',
  }]);
  if (!confirm) {
    console.log('Restauración cancelada.');
    return;
  }
  const tables = await restoreBackup(file);
  console.log(`Restauración completada (${tables.length} colecciones).`);
}

export async function backupMenuCommand() {
  const { action } = await inquirer.prompt([{
    type: 'list', name: 'action', message: 'Respaldo y restauración:',
    choices: ['Crear respaldo completo', 'Crear respaldo seleccionado', 'Restaurar respaldo', 'Volver'],
  }]);
  if (action === 'Crear respaldo completo') await backupCommand();
  if (action === 'Crear respaldo seleccionado') await backupCommand(['--select']);
  if (action === 'Restaurar respaldo') await restoreCommand();
}
