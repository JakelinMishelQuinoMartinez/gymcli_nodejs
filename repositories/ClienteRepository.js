import { pool } from '../config/database.js';

export class ClienteRepository {
  async crear(cliente, conn = pool) {
    const [result] = await conn.query(
      'INSERT INTO clientes (nombre, email, telefono) VALUES (?, ?, ?)',
      [cliente.nombre, cliente.email, cliente.telefono]
    );
    return result.insertId;
  }

  async listar(soloActivos = true) {
    const sql = soloActivos
      ? 'SELECT * FROM clientes WHERE activo = TRUE ORDER BY nombre'
      : 'SELECT * FROM clientes ORDER BY nombre';
    const [rows] = await pool.query(sql);
    return rows;
  }

  async buscarPorId(id) {
    const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async buscarPorEmail(email) {
    const [rows] = await pool.query('SELECT * FROM clientes WHERE email = ?', [email]);
    return rows[0] || null;
  }

  async actualizar(id, datos) {
    const [result] = await pool.query(
      'UPDATE clientes SET nombre = ?, email = ?, telefono = ?, activo = ? WHERE id = ?',
      [datos.nombre, datos.email, datos.telefono, datos.activo, id]
    );
    return result.affectedRows;
  }

  async eliminarLogico(id) {
    const [result] = await pool.query('UPDATE clientes SET activo = FALSE WHERE id = ?', [id]);
    return result.affectedRows;
  }
}
