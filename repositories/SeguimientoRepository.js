import { pool } from '../config/database.js';

export class SeguimientoRepository {
  async crear(seg, conn = pool) {
    const [r] = await conn.query(
      `INSERT INTO seguimiento_fisico (plan_cliente_id, fecha, peso_kg, grasa_corporal, foto_ruta, notas)
       VALUES (?,?,?,?,?,?)`,
      [seg.plan_cliente_id, seg.fecha, seg.peso_kg, seg.grasa_corporal, seg.foto_ruta, seg.notas]
    );
    return r.insertId;
  }

  async listarPorPlanCliente(plan_cliente_id) {
    const [rows] = await pool.query(
      'SELECT * FROM seguimiento_fisico WHERE plan_cliente_id=? ORDER BY fecha ASC',
      [plan_cliente_id]
    );
    return rows;
  }

  async buscarPorId(id) {
    const [rows] = await pool.query('SELECT * FROM seguimiento_fisico WHERE id=?', [id]);
    return rows[0] || null;
  }

  async eliminarFisico(id) {
    const [r] = await pool.query('DELETE FROM seguimiento_fisico WHERE id=?', [id]);
    return r.affectedRows;
  }

  async marcarInactivo(id) {
    await pool.query('UPDATE seguimiento_fisico SET estado="inactivo" WHERE id=?', [id]);
  }

  // Usado en la cascada de cancelación (HU-03a)
  async inactivarPorPlanCliente(plan_cliente_id, conn = pool) {
    await conn.query(
      'UPDATE seguimiento_fisico SET estado="inactivo" WHERE plan_cliente_id=? AND estado="activo"',
      [plan_cliente_id]
    );
  }

  // Historial de TODOS los clientes (no solo uno) para vista general
  async listarTodos() {
    const [rows] = await pool.query(
      `SELECT s.id, c.nombre AS cliente, s.fecha, s.peso_kg, s.grasa_corporal, s.estado
       FROM seguimiento_fisico s
       JOIN planes_clientes pc ON pc.id = s.plan_cliente_id
       JOIN clientes c ON c.id = pc.cliente_id
       ORDER BY s.fecha DESC`
    );
    return rows;
  }
}
