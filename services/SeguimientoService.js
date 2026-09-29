import { SeguimientoFisico } from '../models/SeguimientoFisico.js';
import { SeguimientoRepository } from '../repositories/SeguimientoRepository.js';
import { MedidaRepository } from '../repositories/MedidaRepository.js';
import { ContratoRepository } from '../repositories/ContratoRepository.js';
import { pool } from '../config/database.js';

export class SeguimientoService {
  constructor(
    repo = new SeguimientoRepository(),
    medidaRepo = new MedidaRepository(),
    contratoRepo = new ContratoRepository()
  ) {
    this.repo = repo;
    this.medidaRepo = medidaRepo;
    this.contratoRepo = contratoRepo;
  }

  // RF-05a: bloquear registro si el contrato del plan no está firmado
  async validarContratoFirmado(plan_cliente_id) {
    const contrato = await this.contratoRepo.buscarActivoPorPlanCliente(plan_cliente_id);
    if (!contrato || !contrato.firmado) {
      throw new Error('No se puede registrar seguimiento: el contrato de este plan no está firmado.');
    }
  }

  // OPERACIÓN CRÍTICA: registro de seguimiento + sus medidas en una sola transacción
  async registrar(datos, medidas = []) {
    await this.validarContratoFirmado(datos.plan_cliente_id);
    const seguimiento = new SeguimientoFisico(datos); // valida peso, grasa, notas, foto

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const id = await this.repo.crear(seguimiento, conn);
      for (const m of medidas) {
        if (!(m.valor_cm > 0 && m.valor_cm <= 300)) {
          throw new Error(`Medida inválida para "${m.nombre}": debe estar entre 0 y 300 cm.`);
        }
        const tipoId = await this.medidaRepo.crearTipoSiNoExiste(m.nombre);
        await this.medidaRepo.registrarValor(id, tipoId, m.valor_cm, conn);
      }
      await conn.commit();
      return id;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async listarCronologico(plan_cliente_id) {
    return this.repo.listarPorPlanCliente(plan_cliente_id);
  }

  // RF-10: física solo si el plan no está activo; si no, lógica. Con try/catch.
  async eliminar(id, planActivo) {
    try {
      if (!planActivo) {
        await this.repo.eliminarFisico(id);
        return 'fisico';
      }
      await this.repo.marcarInactivo(id);
      return 'logico';
    } catch (err) {
      throw new Error(`No se pudo eliminar el registro: ${err.message}`);
    }
  }
}
