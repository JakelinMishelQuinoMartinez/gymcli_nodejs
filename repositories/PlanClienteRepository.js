import { pool } from '../config/database.js';

export class PlanClienteRepository {
  async crear(datos, conn = pool) {
    const [r] = await conn.query(
      'INSERT INTO planes_clientes (cliente_id, plan_id, fecha_inicio, fecha_fin, estado) VALUES (?,?,?,?,"activo")',
      [datos.cliente_id, datos.plan_id, datos.fecha_inicio, datos.fecha_fin]
    );
    return r.insertId;
  }

  async buscarActivoPorClienteYPlan(cliente_id, plan_id) {
    const [rows] = await pool.query(
      'SELECT * FROM planes_clientes WHERE cliente_id=? AND plan_id=? AND estado="activo"',
      [cliente_id, plan_id]
    );
    return rows[0] || null;
  }

  async buscarPorId(id, conn = pool) {
    const [rows] = await conn.query('SELECT * FROM planes_clientes WHERE id=?', [id]);
    return rows[0] || null;
  }

  async actualizarEstado(id, estado, conn = pool) {
    await conn.query('UPDATE planes_clientes SET estado=? WHERE id=?', [estado, id]);
  }

  async actualizarFechaFin(id, fecha_fin, conn = pool) {
    await conn.query('UPDATE planes_clientes SET fecha_fin=? WHERE id=?', [fecha_fin, id]);
  }

  async contratoActivoDeCliente(clienteIdOrEmail) {
    const [rows] = await pool.query(
      `SELECT pc.*, c.nombre AS cliente_nombre, c.email, p.nombre AS plan_nombre,
              ct.id AS contrato_id, ct.fecha_inicio AS ct_inicio, ct.fecha_fin AS ct_fin,
              ct.precio, ct.firmado
       FROM planes_clientes pc
       JOIN clientes c ON c.id = pc.cliente_id
       JOIN planes_entrenamiento p ON p.id = pc.plan_id
       JOIN contratos ct ON ct.plan_cliente_id = pc.id AND ct.estado = 'activo'
       WHERE pc.estado = 'activo' AND (c.id = ? OR c.email = ?)
       LIMIT 1`,
      [clienteIdOrEmail, clienteIdOrEmail]
    );
    return rows[0] || null;
  }

  // Lista asignaciones ACTIVAS con nombre de cliente y plan (para elegir sin adivinar IDs)
  async listarActivosConDetalle() {
    const [rows] = await pool.query(
      `SELECT pc.id, c.nombre AS cliente, p.nombre AS plan, pc.fecha_inicio, pc.fecha_fin, pc.estado
       FROM planes_clientes pc
       JOIN clientes c ON c.id = pc.cliente_id
       JOIN planes_entrenamiento p ON p.id = pc.plan_id
       WHERE pc.estado = 'activo'
       ORDER BY pc.id`
    );
    return rows;
  }

  // Lista TODAS las asignaciones (cualquier estado) con nombre de cliente y plan
  async listarTodosConDetalle() {
    const [rows] = await pool.query(
      `SELECT pc.id, c.nombre AS cliente, p.nombre AS plan, pc.fecha_inicio, pc.fecha_fin, pc.estado
       FROM planes_clientes pc
       JOIN clientes c ON c.id = pc.cliente_id
       JOIN planes_entrenamiento p ON p.id = pc.plan_id
       ORDER BY pc.id`
    );
    return rows;
  }

  // Planes activos que ya tiene un cliente (para la alerta al asignar uno nuevo)
  async contratosActivosDeCliente(cliente_id) {
    const [rows] = await pool.query(
      `SELECT pc.id, p.nombre AS plan FROM planes_clientes pc
       JOIN planes_entrenamiento p ON p.id = pc.plan_id
       WHERE pc.cliente_id = ? AND pc.estado = 'activo'`,
      [cliente_id]
    );
    return rows;
  }
}
