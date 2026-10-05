import { pool } from '../config/database.js';

export class ClienteExportRepository {
  constructor(db = pool) { this.db = db; }

  async obtenerProgreso(identificador) {
    const esId = /^\d+$/.test(String(identificador).trim());
    const [clientes] = await this.db.query(
      `SELECT * FROM clientes WHERE ${esId ? 'id = ?' : 'LOWER(nombre) = LOWER(?)'} LIMIT 1`,
      [esId ? Number(identificador) : String(identificador).trim()]
    );
    const c = clientes[0];
    if (!c) return null;
    return { datos: c};
  }
}
