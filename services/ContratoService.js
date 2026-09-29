import dayjs from 'dayjs';
import { pool } from '../config/database.js';
import { PlanRepository } from '../repositories/PlanRepository.js';
import { PlanClienteRepository } from '../repositories/PlanClienteRepository.js';
import { ContratoRepository } from '../repositories/ContratoRepository.js';
import { ClienteRepository } from '../repositories/ClienteRepository.js';
import { SeguimientoRepository } from '../repositories/SeguimientoRepository.js';
import { NutricionRepository } from '../repositories/NutricionRepository.js';
import { FinanzasRepository } from '../repositories/FinanzasRepository.js';
import { ContratoFactory } from '../factories/ContratoFactory.js';
import { TransaccionFinanciera } from '../models/TransaccionFinanciera.js';

export class ContratoService {
  constructor(
    planRepo = new PlanRepository(),
    planClienteRepo = new PlanClienteRepository(),
    contratoRepo = new ContratoRepository(),
    clienteRepo = new ClienteRepository(),
    seguimientoRepo = new SeguimientoRepository(),
    nutricionRepo = new NutricionRepository(),
    finanzasRepo = new FinanzasRepository(),
    connectionPool = pool
  ) {
    this.planRepo = planRepo;
    this.planClienteRepo = planClienteRepo;
    this.contratoRepo = contratoRepo;
    this.clienteRepo = clienteRepo;
    this.seguimientoRepo = seguimientoRepo;
    this.nutricionRepo = nutricionRepo;
    this.finanzasRepo = finanzasRepo;
    this.connectionPool = connectionPool;
  }

  // OPERACIÓN CRÍTICA: asigna un plan y genera el contrato en UNA sola transacción (RF-05)
  async asignarPlan(cliente_id, plan_id) {
    const cliente = await this.clienteRepo.buscarPorId(cliente_id);
    if (!cliente || !cliente.activo) throw new Error('Cliente inexistente o dado de baja.');

    const plan = await this.planRepo.buscarPorId(plan_id);
    if (!plan || plan.estado !== 'activo') throw new Error('Plan inexistente o no disponible.');

    const existente = await this.planClienteRepo.buscarActivoPorClienteYPlan(cliente_id, plan_id);
    if (existente) throw new Error('El cliente ya tiene un plan activo de este mismo tipo.');

    const conn = await this.connectionPool.getConnection();
    try {
      await conn.beginTransaction();

      const hoy = dayjs().format('YYYY-MM-DD');
      const contratoBorrador = ContratoFactory.crear({
        plan_cliente_id: null,
        fecha_inicio: hoy,
        duracionMeses: plan.duracion_meses,
        precio: plan.precio,
        condiciones: `Plan ${plan.nombre} - ${plan.duracion_meses} meses - Nivel ${plan.nivel}`,
      });

      const planClienteId = await this.planClienteRepo.crear({
        cliente_id, plan_id,
        fecha_inicio: contratoBorrador.fecha_inicio,
        fecha_fin: contratoBorrador.fecha_fin,
      }, conn);

      contratoBorrador.plan_cliente_id = planClienteId;
      const contratoId = await this.contratoRepo.crear(contratoBorrador, conn);

      await conn.commit();
      return { planClienteId, contratoId, contrato: contratoBorrador };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async firmarContrato(contratoId) {
    await this.contratoRepo.marcarFirmado(contratoId);
  }

  // OPERACIÓN CRÍTICA: cancelación con cascada condicional (RF-07 / HU-03a)
  async cancelar(planClienteId, devolucion = null) {
    const planCliente = await this.planClienteRepo.buscarPorId(planClienteId);
    if (!planCliente || planCliente.estado !== 'activo') {
      throw new Error('Solo se puede cancelar un plan_cliente en estado activo.');
    }
    const contrato = await this.contratoRepo.buscarActivoPorPlanCliente(planClienteId);
    if (!contrato) throw new Error('No se encontró un contrato activo para este plan.');

    const conn = await this.connectionPool.getConnection();
    try {
      await conn.beginTransaction();

      await this.contratoRepo.actualizarEstado(contrato.id, 'cancelado', conn);
      await this.planClienteRepo.actualizarEstado(planClienteId, 'cancelado', conn);

      // RF-05a: solo hay cascada si el contrato llegó a firmarse (nunca inició ejecución si no)
      if (contrato.firmado) {
        await this.seguimientoRepo.inactivarPorPlanCliente(planClienteId, conn);
        await this.nutricionRepo.inactivarPorPlanCliente(planClienteId, conn);
      }

      if (devolucion && devolucion.monto > 0) {
        const tx = new TransaccionFinanciera({
          cliente_id: devolucion.cliente_id,
          tipo: 'egreso',
          categoria: 'Devolución por cancelación',
          monto: devolucion.monto,
          descripcion: `Devolución por cancelación del plan_cliente ${planClienteId}`,
          fecha: dayjs().format('YYYY-MM-DD'),
        });
        await this.finanzasRepo.registrar(tx, conn);
      }

      await conn.commit();
      return { cancelado: true, conCascada: contrato.firmado };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // OPERACIÓN CRÍTICA: finalización por vigencia (RF-20 / HU-03b)
  async finalizar(planClienteId) {
    const planCliente = await this.planClienteRepo.buscarPorId(planClienteId);
    if (!planCliente || planCliente.estado !== 'activo') {
      throw new Error('Solo se puede finalizar un plan_cliente en estado activo.');
    }
    const contrato = await this.contratoRepo.buscarActivoPorPlanCliente(planClienteId);
    if (!contrato || !contrato.firmado) {
      throw new Error('Solo se puede finalizar un contrato firmado.');
    }

    const conn = await this.connectionPool.getConnection();
    try {
      await conn.beginTransaction();
      await this.contratoRepo.actualizarEstado(contrato.id, 'finalizado', conn);
      await this.planClienteRepo.actualizarEstado(planClienteId, 'finalizado', conn);
      await this.nutricionRepo.finalizarPorPlanCliente(planClienteId, conn);
      // El seguimiento permanece activo (histórico), no se toca.
      await conn.commit();
      return { finalizado: true };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // OPERACIÓN CRÍTICA: renovación Modelo A (RF-21 / HU-03c)
  // Simplificación documentada: esta primera entrega solo renueva planes
  // en estado 'activo' con contrato firmado (no cubre renovar un plan
  // ya 'finalizado'; queda como mejora futura).
  async renovar(planClienteId) {
    const planCliente = await this.planClienteRepo.buscarPorId(planClienteId);
    if (!planCliente || planCliente.estado !== 'activo') {
      throw new Error('Solo se puede renovar un plan_cliente en estado activo.');
    }
    const contratoAnterior = await this.contratoRepo.buscarActivoPorPlanCliente(planClienteId);
    if (!contratoAnterior || !contratoAnterior.firmado) {
      throw new Error('Solo se puede renovar un contrato firmado.');
    }
    const plan = await this.planRepo.buscarPorId(planCliente.plan_id);

    const conn = await this.connectionPool.getConnection();
    try {
      await conn.beginTransaction();

      await this.contratoRepo.actualizarEstado(contratoAnterior.id, 'finalizado', conn);

      const nuevoContrato = ContratoFactory.crear({
        plan_cliente_id: planClienteId,
        fecha_inicio: contratoAnterior.fecha_fin, // sin huecos entre contratos
        duracionMeses: plan.duracion_meses,
        precio: plan.precio,
        condiciones: `Renovación - Plan ${plan.nombre} - ${plan.duracion_meses} meses`,
      });
      const nuevoContratoId = await this.contratoRepo.crear(nuevoContrato, conn);
      await this.planClienteRepo.actualizarFechaFin(planClienteId, nuevoContrato.fecha_fin, conn);

      await conn.commit();
      return { nuevoContratoId, nuevaFechaFin: nuevoContrato.fecha_fin };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}
