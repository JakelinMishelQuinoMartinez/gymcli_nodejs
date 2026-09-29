import inquirer from 'inquirer';
import { ClienteService } from '../services/ClienteService.js';
import { pedirId, reglaRegex } from '../utils/prompts.js';
import { REGEX_NOMBRE, REGEX_EMAIL, REGEX_TELEFONO } from '../utils/validators.js';
import { tituloMenu, exito, error } from '../utils/theme.js';

const service = new ClienteService();

export async function menuClientes() {
  let salir = false;
  while (!salir) {
    tituloMenu('GESTIÓN DE CLIENTES');
    const { opcion } = await inquirer.prompt([{
      type: 'list', name: 'opcion', message: 'Elige una opción:',
      choices: ['Registrar cliente', 'Listar clientes', 'Actualizar cliente', 'Eliminar cliente', 'Volver'],
    }]);
    try {
      if (opcion === 'Registrar cliente') await registrarCliente();
      if (opcion === 'Listar clientes') await listarClientes();
      if (opcion === 'Actualizar cliente') await actualizarCliente();
      if (opcion === 'Eliminar cliente') await eliminarCliente();
      if (opcion === 'Volver') salir = true;
    } catch (err) {
      error(err.message);
    }
  }
}

async function registrarCliente() {
  const datos = await inquirer.prompt([
    { name: 'nombre', message: 'Nombre completo:', validate: reglaRegex(REGEX_NOMBRE, 'Nombre inválido: 2-100 caracteres, solo letras y espacios.') },
    { name: 'email', message: 'Correo:', validate: reglaRegex(REGEX_EMAIL, 'Correo inválido. Formato esperado: usuario@dominio.com') },
    { name: 'telefono', message: 'Teléfono:', validate: reglaRegex(REGEX_TELEFONO, 'Teléfono inválido: 8-15 dígitos, + opcional.') },
  ]);
  const cliente = await service.registrar(datos);
  exito(`Cliente registrado con id ${cliente.id}`);
}

async function listarClientes() {
  const clientes = await service.listar(false); // incluye inactivos: la lista debe verse completa
  if (!clientes.length) return console.log('No hay clientes registrados.');
  console.table(clientes.map(c => ({
    ID: c.id,
    Nombre: c.nombre,
    Email: c.email,
    Teléfono: c.telefono,
    Activo: c.activo ? 'Sí' : 'No',
    'Registrado el': c.creado_en instanceof Date ? c.creado_en.toISOString().slice(0, 10) : String(c.creado_en).slice(0, 10),
  })));
}

async function actualizarCliente() {
  const id = await pedirId('ID del cliente a actualizar');
  if (id === null) return;
  const existente = await service.buscarPorId(id);
  if (!existente) return error('Cliente no encontrado. Verifica el ID con "Listar clientes".');

  console.log(`\nDatos actuales de #${existente.id}:`);
  console.log(`  Nombre:   ${existente.nombre}`);
  console.log(`  Email:    ${existente.email}`);
  console.log(`  Teléfono: ${existente.telefono}`);
  console.log(`  Activo:   ${existente.activo ? 'Sí' : 'No'}`);
  console.log('\nPresiona ENTER en cualquier campo para dejarlo tal cual está.\n');

  const nuevo = await inquirer.prompt([
    { name: 'nombre', message: 'Nuevo nombre:', default: existente.nombre, validate: reglaRegex(REGEX_NOMBRE, 'Nombre inválido: 2-100 caracteres, solo letras y espacios.') },
    { name: 'email', message: 'Nuevo correo:', default: existente.email, validate: reglaRegex(REGEX_EMAIL, 'Correo inválido.') },
    { name: 'telefono', message: 'Nuevo teléfono:', default: existente.telefono, validate: reglaRegex(REGEX_TELEFONO, 'Teléfono inválido.') },
    { type: 'list', name: 'activo', message: 'Estado:', default: existente.activo, choices: [{ name: 'Activo', value: true }, { name: 'Inactivo', value: false }] },
  ]);

  await service.actualizar(id, nuevo);
  exito('Cliente actualizado.');
}

async function eliminarCliente() {
  const id = await pedirId('ID del cliente a eliminar');
  if (id === null) return;
  const existente = await service.buscarPorId(id);
  if (!existente) return error('Cliente no encontrado. Verifica el ID con "Listar clientes".');

  const { confirmar } = await inquirer.prompt([{ type: 'confirm', name: 'confirmar', message: `¿Confirmas dar de baja a "${existente.nombre}"?` }]);
  if (!confirmar) return console.log('Operación cancelada.');

  await service.eliminar(id);
  exito('Cliente dado de baja (borrado lógico: activo = false).');
  console.log('El registro permanece en MySQL para conservar su historial de planes y pagos; no se elimina físicamente (así lo pide RF-02).');
}
