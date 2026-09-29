export class Contrato {
  constructor({ id = null, plan_cliente_id, fecha_inicio, fecha_fin, precio, condiciones, estado = 'activo', firmado = false }) {
    this.id = id;
    this.plan_cliente_id = plan_cliente_id;
    this.fecha_inicio = fecha_inicio;
    this.fecha_fin = fecha_fin;
    this.precio = Number(precio);
    this.condiciones = condiciones;
    this.estado = estado;
    this.firmado = firmado;
    this.validar();
  }

  validar() {
    if (new Date(this.fecha_fin) <= new Date(this.fecha_inicio)) {
      throw new Error('La fecha de fin debe ser posterior a la fecha de inicio.');
    }
    if (!(this.precio > 0)) throw new Error('El precio del contrato debe ser mayor a 0.');
    if (!this.condiciones) throw new Error('Las condiciones del contrato son obligatorias.');
  }
}
