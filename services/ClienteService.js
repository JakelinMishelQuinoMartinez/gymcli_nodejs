import { Cliente } from '../models/Cliente.js';
import { ClienteRepository } from '../repositories/ClienteRepository.js';

export class ClienteService {
  constructor(clienteRepository = new ClienteRepository()) {
    this.repo = clienteRepository;
  }

  async registrar(datos) {
    const cliente = new Cliente(datos); // valida
    try {
      const id = await this.repo.crear(cliente);
      return { id, ...datos };
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new Error(`Ya existe un cliente con el correo ${datos.email}.`);
      }
      throw err;
    }
  }

  async listar(soloActivos = true) {
    return this.repo.listar(soloActivos);
  }

  async buscarPorId(id) {
    return this.repo.buscarPorId(id);
  }

  async actualizar(id, datos) {
    const existente = await this.repo.buscarPorId(id);
    if (!existente) throw new Error('Cliente no encontrado.');
    new Cliente({ id, nombre: datos.nombre, email: datos.email, telefono: datos.telefono, activo: datos.activo }); // valida
    try {
      return await this.repo.actualizar(id, datos);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new Error(`Ya existe otro cliente con el correo ${datos.email}.`);
      }
      throw err;
    }
  }

  async eliminar(id) {
    const existente = await this.repo.buscarPorId(id);
    if (!existente) throw new Error('Cliente no encontrado.');
    return this.repo.eliminarLogico(id);
  }
}
