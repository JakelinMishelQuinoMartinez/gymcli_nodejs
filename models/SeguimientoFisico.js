export class SeguimientoFisico {
  constructor({ id = null, plan_cliente_id, fecha, peso_kg, grasa_corporal = null, foto_ruta = null, notas = null, estado = 'activo' }) {
    this.id = id;
    this.plan_cliente_id = plan_cliente_id;
    this.fecha = fecha;
    this.peso_kg = Number(peso_kg);
    this.grasa_corporal = grasa_corporal !== null && grasa_corporal !== '' ? Number(grasa_corporal) : null;
    this.foto_ruta = foto_ruta || null;
    this.notas = notas || null;
    this.estado = estado;
    this.validar();
  }

  validar() {
    if (!(this.peso_kg >= 20 && this.peso_kg <= 300)) {
      throw new Error('El peso debe estar entre 20 y 300 kg.');
    }
    if (this.grasa_corporal !== null && !(this.grasa_corporal >= 3 && this.grasa_corporal <= 60)) {
      throw new Error('El % de grasa corporal debe estar entre 3 y 60.');
    }
    if (this.foto_ruta && this.foto_ruta.length > 255) {
      throw new Error('La ruta de foto no puede superar 255 caracteres.');
    }
    if (this.notas && this.notas.length > 500) {
      throw new Error('Las notas no pueden superar 500 caracteres.');
    }
  }
}
