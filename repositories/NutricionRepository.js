import { pool } from '../config/database.js';

export class NutricionRepository {
  async crearPlan(plan, conn = pool) {
    const [r] = await conn.query(
      `INSERT INTO planes_nutricionales (plan_cliente_id, nombre, meta_calorica_diaria, descripcion)
       VALUES (?,?,?,?)`,
      [plan.plan_cliente_id, plan.nombre, plan.meta_calorica_diaria, plan.descripcion]
    );
    return r.insertId;
  }

  async buscarActivoPorPlanCliente(plan_cliente_id) {
    const [rows] = await pool.query(
      'SELECT * FROM planes_nutricionales WHERE plan_cliente_id=? AND estado="activo"',
      [plan_cliente_id]
    );
    return rows[0] || null;
  }

  async registrarAlimento(alimento) {
    const [r] = await pool.query(
      `INSERT INTO alimentos (plan_nutricional_id, fecha, nombre, calorias, momento)
       VALUES (?,?,?,?,?)`,
      [alimento.plan_nutricional_id, alimento.fecha, alimento.nombre, alimento.calorias, alimento.momento]
    );
    return r.insertId;
  }

  async reporteSemanal(plan_nutricional_id, fechaInicio, fechaFin) {
    const [rows] = await pool.query(
      `SELECT fecha, SUM(calorias) AS total_dia FROM alimentos
       WHERE plan_nutricional_id=? AND fecha BETWEEN ? AND ?
       GROUP BY fecha ORDER BY fecha`,
      [plan_nutricional_id, fechaInicio, fechaFin]
    );
    return rows;
  }

  // Usados en las cascadas de cancelación (HU-03a) y finalización (HU-03b)
  async inactivarPorPlanCliente(plan_cliente_id, conn = pool) {
    await conn.query(
      'UPDATE planes_nutricionales SET estado="inactivo" WHERE plan_cliente_id=? AND estado="activo"',
      [plan_cliente_id]
    );
  }

  async finalizarPorPlanCliente(plan_cliente_id, conn = pool) {
    await conn.query(
      'UPDATE planes_nutricionales SET estado="finalizado" WHERE plan_cliente_id=? AND estado="activo"',
      [plan_cliente_id]
    );
  }

  // Planes nutricionales con nombre de cliente (para elegir sin adivinar IDs)
  async listarPlanesConDetalle() {
    const [rows] = await pool.query(
      `SELECT pn.id, c.nombre AS cliente, pn.nombre, pn.meta_calorica_diaria, pn.estado
       FROM planes_nutricionales pn
       JOIN planes_clientes pc ON pc.id = pn.plan_cliente_id
       JOIN clientes c ON c.id = pc.cliente_id
       ORDER BY pn.id`
    );
    return rows;
  }
}
