import chalk from 'chalk';
import { menuPrincipal } from './commands/menu.js';
import { pool } from './config/database.js';

process.on('unhandledRejection', (err) => {
  console.log(chalk.red(`✖ Error no controlado: ${err.message}`));
  process.exitCode = 1;
});

async function main() {
  console.log(chalk.bold.green('=== GymCLI — Sistema de Gestión de un Gimnasio ==='));
  try {
    await menuPrincipal();
  } catch (err) {
    console.log(chalk.red(`✖ Error fatal: ${err.message}`));
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
