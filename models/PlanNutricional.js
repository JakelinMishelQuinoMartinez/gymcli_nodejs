export class PlanNutricional {
  constructor({ id = null, plan_cliente_id, nombre, meta_calorica_diaria, descripcion = null, estado = 'activo' }) {
    this.id = id;
    this.plan_cliente_id = plan_cliente_id;
    this.nombre = nombre;
    this.meta_calorica_diaria = Number(meta_calorica_diaria);
    this.descripcion = descripcion || null;
    this.estado = estado;
    this.validar();
  }

  validar() {
    if (!this.nombre) throw new Error('El nombre del plan nutricional es obligatorio.');
    if (!(this.meta_calorica_diaria >= 1000 && this.meta_calorica_diaria <= 5000)) {
      throw new Error('La meta calórica diaria debe estar entre 1000 y 5000 kcal.');
    }
  }
}
