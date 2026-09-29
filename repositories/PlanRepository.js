import { pool } from '../config/database.js';

export class PlanRepository {
  async crear(plan) {
    const [r] = await pool.query(
      'INSERT INTO planes_entrenamiento (nombre, duracion_meses, meta_fisica, nivel, precio) VALUES (?,?,?,?,?)',
      [plan.nombre, plan.duracion_meses, plan.meta_fisica, plan.nivel, plan.precio]
    );
    return r.insertId;
  }

  async listarActivos(nivel = null) {
    const sql = nivel
      ? 'SELECT * FROM planes_entrenamiento WHERE estado="activo" AND nivel=? ORDER BY precio'
      : 'SELECT * FROM planes_entrenamiento WHERE estado="activo" ORDER BY precio';
    const [rows] = await pool.query(sql, nivel ? [nivel] : []);
    return rows;
  }

  async buscarPorId(id) {
    const [rows] = await pool.query('SELECT * FROM planes_entrenamiento WHERE id=?', [id]);
    return rows[0] || null;
  }

  async actualizar(id, datos) {
    const [r] = await pool.query(
      'UPDATE planes_entrenamiento SET nombre=?, duracion_meses=?, meta_fisica=?, nivel=?, precio=? WHERE id=?',
      [datos.nombre, datos.duracion_meses, datos.meta_fisica, datos.nivel, datos.precio, id]
    );
    return r.affectedRows;
  }

  async marcarInactivo(id) {
    await pool.query('UPDATE planes_entrenamiento SET estado="inactivo" WHERE id=?', [id]);
  }
}
