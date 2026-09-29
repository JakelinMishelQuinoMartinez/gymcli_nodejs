import { NIVELES_PLAN } from '../utils/validators.js';

export class PlanEntrenamiento {
  constructor({ id = null, nombre, duracion_meses, meta_fisica, nivel, precio, estado = 'activo' }) {
    this.id = id;
    this.nombre = nombre;
    this.duracion_meses = Number(duracion_meses);
    this.meta_fisica = meta_fisica;
    this.nivel = nivel;
    this.precio = Number(precio);
    this.estado = estado;
    this.validar();
  }

  validar() {
    if (!this.nombre || this.nombre.length < 2) throw new Error('Nombre del plan inválido.');
    if (!Number.isInteger(this.duracion_meses) || this.duracion_meses < 1 || this.duracion_meses > 24) {
      throw new Error('Duración debe ser un entero entre 1 y 24 meses.');
    }
    if (!NIVELES_PLAN.includes(this.nivel)) {
      throw new Error(`Nivel inválido. Debe ser: ${NIVELES_PLAN.join(', ')}.`);
    }
    if (!(this.precio > 0) || this.precio > 100000) {
      throw new Error('Precio debe ser mayor a 0 y máximo 100,000 GTQ.');
    }
  }
}
