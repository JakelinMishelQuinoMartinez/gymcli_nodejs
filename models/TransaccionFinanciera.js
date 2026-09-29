import { TIPOS_TRANSACCION } from '../utils/validators.js';

export class TransaccionFinanciera {
  constructor({ id = null, cliente_id = null, tipo, categoria, monto, descripcion = null, fecha }) {
    this.id = id;
    this.cliente_id = cliente_id || null;
    this.tipo = tipo;
    this.categoria = categoria;
    this.monto = Number(monto);
    this.descripcion = descripcion || null;
    this.fecha = fecha;
    this.validar();
  }

  validar() {
    if (!TIPOS_TRANSACCION.includes(this.tipo)) throw new Error("Tipo debe ser 'ingreso' o 'egreso'.");
    if (!this.categoria) throw new Error('La categoría es obligatoria.');
    if (!(this.monto > 0) || this.monto > 1000000) {
      throw new Error('El monto debe ser mayor a 0 y máximo 1,000,000 GTQ.');
    }
    const hoy = new Date();
    const haceUnAnio = new Date();
    haceUnAnio.setFullYear(hoy.getFullYear() - 1);
    const f = new Date(this.fecha);
    if (f > hoy || f < haceUnAnio) {
      throw new Error('La fecha no puede ser futura ni anterior a 1 año.');
    }
  }
}
