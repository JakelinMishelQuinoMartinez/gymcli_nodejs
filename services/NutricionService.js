import { PlanNutricional } from '../models/PlanNutricional.js';
import { NutricionRepository } from '../repositories/NutricionRepository.js';
import { ContratoRepository } from '../repositories/ContratoRepository.js';

export class NutricionService {
  constructor(repo = new NutricionRepository(), contratoRepo = new ContratoRepository()) {
    this.repo = repo;
    this.contratoRepo = contratoRepo;
  }

  async crearPlan(datos) {
    const contrato = await this.contratoRepo.buscarActivoPorPlanCliente(datos.plan_cliente_id);
    if (!contrato || !contrato.firmado) {
      throw new Error('No se puede crear un plan nutricional: el contrato no está firmado.');
    }
    const existente = await this.repo.buscarActivoPorPlanCliente(datos.plan_cliente_id);
    if (existente) throw new Error('Este cliente ya tiene un plan nutricional activo.');

    const plan = new PlanNutricional(datos); // valida
    const id = await this.repo.crearPlan(plan);
    return { id, ...datos };
  }

  async registrarAlimento(datos) {
    if (!(datos.calorias > 0 && datos.calorias <= 5000)) {
      throw new Error('Las calorías deben estar entre 1 y 5000.');
    }
    return this.repo.registrarAlimento(datos);
  }

  async reporteSemanal(plan_nutricional_id, fechaInicio, fechaFin) {
    const dias = await this.repo.reporteSemanal(plan_nutricional_id, fechaInicio, fechaFin);
    const total = dias.reduce((acc, d) => acc + Number(d.total_dia), 0);
    const promedio = dias.length ? total / dias.length : 0;
    return { dias, total, promedio };
  }
}
