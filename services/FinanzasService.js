import { TransaccionFinanciera } from '../models/TransaccionFinanciera.js';
import { FinanzasRepository } from '../repositories/FinanzasRepository.js';
import { pool } from '../config/database.js';

export class FinanzasService {
  constructor(repo = new FinanzasRepository()) {
    this.repo = repo;
  }

  // OPERACIÓN CRÍTICA: registro financiero con transacción real
  async registrar(datos) {
    const tx = new TransaccionFinanciera(datos); // valida
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const id = await this.repo.registrar(tx, conn);
      await conn.commit();
      return id;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async balance(filtros) {
    return this.repo.balance(filtros);
  }
}
