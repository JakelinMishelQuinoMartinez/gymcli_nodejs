import { PlanEntrenamiento } from '../models/PlanEntrenamiento.js';
import { PlanRepository } from '../repositories/PlanRepository.js';

export class PlanService {
  constructor(repo = new PlanRepository()) {
    this.repo = repo;
  }

  async crear(datos) {
    const plan = new PlanEntrenamiento(datos); // valida
    const id = await this.repo.crear(plan);
    return { id, ...datos };
  }

  async listarActivos(nivel = null) {
    return this.repo.listarActivos(nivel);
  }

  async buscarPorId(id) {
    return this.repo.buscarPorId(id);
  }

  async actualizar(id, datos) {
    const existente = await this.repo.buscarPorId(id);
    if (!existente) throw new Error('Plan no encontrado.');
    new PlanEntrenamiento({ id, ...datos }); // valida
    return this.repo.actualizar(id, datos);
  }

  async eliminar(id) {
    const existente = await this.repo.buscarPorId(id);
    if (!existente) throw new Error('Plan no encontrado.');
    return this.repo.marcarInactivo(id);
  }
}
