import fs from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../config/database.js';

export const TABLES = [
  'clientes', 'planes_entrenamiento', 'planes_clientes', 'contratos',
  'seguimiento_fisico', 'tipos_medida', 'medidas_corporales',
  'planes_nutricionales', 'alimentos', 'transacciones_financieras',
];

const safeTable = (table) => {
  if (!TABLES.includes(table)) throw new Error(`Colección no permitida: ${table}`);
  return `\`${table}\``;
};

async function schemaFor(connection, tables) {
  const schema = {};
  for (const table of tables) {
    const [columns] = await connection.query(`SHOW COLUMNS FROM ${safeTable(table)}`);
    schema[table] = columns.map(({ Field, Type, Null, Key, Default, Extra }) => ({
      field: Field, type: Type, nullable: Null === 'YES', key: Key,
      default: Default, extra: Extra,
    }));
  }
  return schema;
}

export async function createBackup(selectedTables = TABLES) {
  const tables = [...new Set(selectedTables)];
  if (!tables.length) throw new Error('Selecciona al menos una colección.');
  tables.forEach(safeTable);
  const connection = await pool.getConnection();
  try {
    await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    await connection.beginTransaction({ consistentSnapshot: true, readOnly: true });
    const schema = await schemaFor(connection, tables);
    const data = {};
    for (const table of tables) {
      const [rows] = await connection.query(`SELECT * FROM ${safeTable(table)}`);
      data[table] = rows;
    }
    await connection.commit();
    const backup = {
      format: 'gymcli-backup', version: 1, database: process.env.DB_NAME,
      createdAt: new Date().toISOString(), tables, schema, data,
    };
    const dir = path.resolve(process.cwd(), 'backups');
    await fs.mkdir(dir, { recursive: true });
    const stamp = backup.createdAt.replace(/:/g, '-').replace(/\.\d{3}Z$/, 'Z');
    const file = path.join(dir, `backup_${stamp}.json`);
    await fs.writeFile(file, `${JSON.stringify(backup, null, 2)}\n`, { flag: 'wx' });
    return file;
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}

export async function inspectBackup(file) {
  const backup = JSON.parse(await fs.readFile(path.resolve(file), 'utf8'));
  if (backup.format !== 'gymcli-backup' || backup.version !== 1 || !Array.isArray(backup.tables)) {
    throw new Error('Formato o versión de respaldo no compatibles.');
  }
  if (!backup.tables.length || new Set(backup.tables).size !== backup.tables.length) {
    throw new Error('La lista de colecciones del respaldo no es válida.');
  }
  for (const table of backup.tables) {
    safeTable(table);
    if (!Array.isArray(backup.data?.[table]) || !Array.isArray(backup.schema?.[table])) {
      throw new Error(`El respaldo está incompleto en ${table}.`);
    }
    for (const row of backup.data[table]) {
      if (!row || Array.isArray(row) || typeof row !== 'object') throw new Error(`Fila inválida en ${table}.`);
      const fields = new Set(backup.schema[table].map((column) => column.field));
      if (Object.keys(row).some((key) => !fields.has(key))) throw new Error(`Columnas inesperadas en ${table}.`);
    }
  }
  return backup;
}

export async function restoreBackup(file) {
  const backup = await inspectBackup(file);
  const connection = await pool.getConnection();
  try {
    const current = await schemaFor(connection, backup.tables);
    if (JSON.stringify(current) !== JSON.stringify(backup.schema)) {
      throw new Error('El esquema de la base de datos no coincide con el respaldo; no se modificaron datos.');
    }
    await connection.beginTransaction();
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of [...backup.tables].reverse()) await connection.query(`DELETE FROM ${safeTable(table)}`);
    for (const table of backup.tables) {
      const rows = backup.data[table];
      if (!rows.length) continue;
      const columns = backup.schema[table].map((column) => column.field);
      const quoted = columns.map((column) => `\`${column.replace(/`/g, '``')}\``).join(', ');
      const placeholders = `(${columns.map(() => '?').join(', ')})`;
      const values = rows.map((row) => columns.map((column) => row[column] ?? null));
      await connection.query(`INSERT INTO ${safeTable(table)} (${quoted}) VALUES ${values.map(() => placeholders).join(', ')}`, values.flat());
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    await connection.commit();
    return backup.tables;
  } catch (error) {
    await connection.rollback().catch(() => {});
    await connection.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}
