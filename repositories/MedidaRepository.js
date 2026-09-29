import { pool } from '../config/database.js';

export class MedidaRepository {
  async listarTipos() {
    const [rows] = await pool.query('SELECT * FROM tipos_medida ORDER BY nombre');
    return rows;
  }

  // Permite agregar una medida corporal nueva sin tocar el esquema
  async crearTipoSiNoExiste(nombre) {
    await pool.query(
      'INSERT INTO tipos_medida (nombre) VALUES (?) ON DUPLICATE KEY UPDATE nombre = nombre',
      [nombre]
    );
    const [rows] = await pool.query('SELECT id FROM tipos_medida WHERE nombre = ?', [nombre]);
    return rows[0].id;
  }

  async registrarValor(seguimiento_id, tipo_medida_id, valor_cm, conn = pool) {
    await conn.query(
      'INSERT INTO medidas_corporales (seguimiento_id, tipo_medida_id, valor_cm) VALUES (?,?,?)',
      [seguimiento_id, tipo_medida_id, valor_cm]
    );
  }

  async listarPorSeguimiento(seguimiento_id) {
    const [rows] = await pool.query(
      `SELECT m.valor_cm, t.nombre FROM medidas_corporales m
       JOIN tipos_medida t ON t.id = m.tipo_medida_id
       WHERE m.seguimiento_id = ?`,
      [seguimiento_id]
    );
    return rows;
  }
}