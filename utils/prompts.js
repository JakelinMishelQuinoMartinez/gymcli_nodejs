import inquirer from 'inquirer';

export async function pedirId(mensaje) {
  const { valor } = await inquirer.prompt([{
    name: 'valor',
    message: `${mensaje} (0 para cancelar):`,
    validate: (input) => {
      const texto = String(input).trim();
      if (texto === '') return 'Debes ingresar un número de ID, o 0 para cancelar.';
      const numero = Number(texto);
      if (!Number.isInteger(numero) || numero < 0) return 'El ID debe ser un número entero positivo (o 0 para cancelar).';
      return true;
    },
    filter: (input) => Number(String(input).trim()),
  }]);
  return valor === 0 ? null : valor;
}

export function reglaTextoRequerido(mensaje, min = 1, max = 255) {
  return (input) => {
    const t = String(input).trim();
    if (t.length < min) return mensaje || `Debe tener al menos ${min} caracteres.`;
    if (t.length > max) return `Máximo ${max} caracteres.`;
    return true;
  };
}

export function reglaRegex(regex, mensajeError) {
  return (input) => (regex.test(String(input).trim()) ? true : mensajeError);
}

export function reglaEntero(min, max) {
  return (input) => {
    const t = String(input).trim();
    if (t === '') return 'Este campo es obligatorio.';
    const n = Number(t);
    if (!Number.isInteger(n)) return 'Debe ser un número entero, sin letras ni decimales.';
    if (n < min || n > max) return `Debe estar entre ${min} y ${max}.`;
    return true;
  };
}

export function reglaDecimal(min, max) {
  return (input) => {
    const t = String(input).trim();
    if (t === '') return 'Este campo es obligatorio.';
    const n = Number(t);
    if (Number.isNaN(n)) return 'Debe ser un número (usa punto decimal, ej. 75.5).';
    if (n < min || n > max) return `Debe estar entre ${min} y ${max}.`;
    return true;
  };
}

export function reglaDecimalOpcional(min, max) {
  return (input) => {
    const t = String(input).trim();
    if (t === '') return true;
    const n = Number(t);
    if (Number.isNaN(n)) return 'Debe ser un número (o déjalo vacío).';
    if (n < min || n > max) return `Debe estar entre ${min} y ${max}, o vacío.`;
    return true;
  };
}

export function reglaFecha() {
  return (input) => {
    const t = String(input).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return 'Formato inválido. Usa YYYY-MM-DD (ej. 2026-09-28).';
    if (Number.isNaN(new Date(t).getTime())) return 'Esa fecha no existe.';
    return true;
  };
}
