import { pool } from './config/database.js';
import { exportarClienteCommand } from './commands/ExportarClienteCommand.js';

try {
  await exportarClienteCommand();
} finally {
  await pool.end();
}
