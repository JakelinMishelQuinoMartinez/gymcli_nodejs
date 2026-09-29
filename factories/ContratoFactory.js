import dayjs from 'dayjs';
import { Contrato } from '../models/Contrato.js';

export class ContratoFactory {
  static crear({ plan_cliente_id, fecha_inicio, duracionMeses, precio, condiciones }) {
    const inicio = dayjs(fecha_inicio);
    const fin = inicio.add(duracionMeses, 'month');
    return new Contrato({
      plan_cliente_id,
      fecha_inicio: inicio.format('YYYY-MM-DD'),
      fecha_fin: fin.format('YYYY-MM-DD'),
      precio,
      condiciones,
      estado: 'activo',
      firmado: false,
    });
  }
}
