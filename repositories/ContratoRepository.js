import { pool } from '../config/database.js';

export class ContratoRepository {
  async crear(contrato, conn = pool) {
    const [r] = await conn.query(
      `INSERT INTO contratos (plan_cliente_id, fecha_inicio, fecha_fin, precio, condiciones, estado, firmado)
       VALUES (?,?,?,?,?,?,?)`,
      [contrato.plan_cliente_id, contrato.fecha_inicio, contrato.fecha_fin, contrato.precio, contrato.condiciones, contrato.estado, contrato.firmado]
    );
    return r.insertId;
  }

  async buscarActivoPorPlanCliente(plan_cliente_id, conn = pool) {
    const [rows] = await conn.query(
      'SELECT * FROM contratos WHERE plan_cliente_id=? AND estado="activo" ORDER BY id DESC LIMIT 1',
      [plan_cliente_id]
    );
    return rows[0] || null;
  }

  async marcarFirmado(id, conn = pool) {
    await conn.query('UPDATE contratos SET firmado=TRUE WHERE id=?', [id]);
  }

  async actualizarEstado(id, estado, conn = pool) {
    await conn.query('UPDATE contratos SET estado=? WHERE id=?', [estado, id]);
  }

  // Contratos vigentes con nombre de cliente y plan (HU-08 / listado pedido)
  async listarActivos() {
    const [rows] = await pool.query(
      `SELECT ct.id AS contrato_id, ct.fecha_inicio, ct.fecha_fin, ct.precio, ct.firmado,
              c.nombre AS cliente, p.nombre AS plan, pc.id AS plan_cliente_id
       FROM contratos ct
       JOIN planes_clientes pc ON pc.id = ct.plan_cliente_id
       JOIN clientes c ON c.id = pc.cliente_id
       JOIN planes_entrenamiento p ON p.id = pc.plan_id
       WHERE ct.estado = 'activo'
       ORDER BY ct.id`
    );
    return rows;
  }
}
