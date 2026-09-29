import { pool } from '../config/database.js';

export class FinanzasRepository {
  async registrar(tx, conn = pool) {
    const [r] = await conn.query(
      `INSERT INTO transacciones_financieras (cliente_id, tipo, categoria, monto, descripcion, fecha)
       VALUES (?,?,?,?,?,?)`,
      [tx.cliente_id, tx.tipo, tx.categoria, tx.monto, tx.descripcion, tx.fecha]
    );
    return r.insertId;
  }

  async balance({ desde = null, hasta = null, cliente_id = null } = {}) {
    let sql = 'SELECT tipo, SUM(monto) AS total FROM transacciones_financieras WHERE 1=1';
    const params = [];
    if (desde) { sql += ' AND fecha >= ?'; params.push(desde); }
    if (hasta) { sql += ' AND fecha <= ?'; params.push(hasta); }
    if (cliente_id) { sql += ' AND cliente_id = ?'; params.push(cliente_id); }
    sql += ' GROUP BY tipo';
    const [rows] = await pool.query(sql, params);
    const ingresos = rows.find(r => r.tipo === 'ingreso')?.total || 0;
    const egresos = rows.find(r => r.tipo === 'egreso')?.total || 0;
    return { ingresos: Number(ingresos), egresos: Number(egresos), neto: Number(ingresos) - Number(egresos) };
  }
}
