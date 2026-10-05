import inquirer from 'inquirer';
import { ClienteExportRepository } from '../repositories/ClienteExportRepository.js';
import { ClienteExportService } from '../services/ClienteExportService.js';

const service = new ClienteExportService(new ClienteExportRepository());

export async function exportarClienteCommand(argumento = process.argv.slice(2).join(' ').trim()) {
  try {
    let identificador = argumento;
    if (!identificador) {
      ({ identificador } = await inquirer.prompt([{
        name: 'identificador', message: 'ID o nombre exacto del cliente:',
        validate: value => String(value).trim().length > 0 || 'El ID o nombre es obligatorio.',
      }]));
    }
    const archivo = await service.exportar(identificador);
    console.log(`Progreso exportado correctamente: ${archivo}`);
    return archivo;
  } catch (err) {
    console.error(`No se pudo exportar el progreso: ${err.message}`);
    process.exitCode = 1;
    return null;
  }
}
