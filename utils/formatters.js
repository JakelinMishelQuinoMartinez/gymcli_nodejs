import dayjs from 'dayjs';

export function formatFecha(fecha) {
  return dayjs(fecha).format('DD/MM/YYYY');
}

export function formatMoneda(valor) {
  return `Q${Number(valor).toFixed(2)}`;
}
