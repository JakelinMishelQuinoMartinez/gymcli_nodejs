import { REGEX_NOMBRE, REGEX_EMAIL, REGEX_TELEFONO } from '../utils/validators.js';

export class Cliente {
  constructor({ id = null, nombre, email, telefono, activo = true }) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.telefono = telefono;
    this.activo = activo;
    this.validar();
  }

  validar() {
    if (!this.nombre || !REGEX_NOMBRE.test(this.nombre)) {
      throw new Error('Nombre inválido: 2-100 caracteres, solo letras y espacios.');
    }
    if (!this.email || !REGEX_EMAIL.test(this.email)) {
      throw new Error('Email inválido.');
    }
    if (!this.telefono || !REGEX_TELEFONO.test(this.telefono)) {
      throw new Error('Teléfono inválido: 8-15 dígitos, + opcional.');
    }
  }
}
