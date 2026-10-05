import fs from 'node:fs/promises';
import path from 'node:path';

export class ClienteExportService {
  constructor(repository, outputDir = path.resolve('exports')) {
    this.repository = repository;
    this.outputDir = outputDir;
  }

  async exportar(identificador) {
    if (identificador === undefined || identificador === null || String(identificador).trim() === '') {
      throw new Error('Indica el ID o nombre del cliente.');
    }
    const cliente = await this.repository.obtenerProgreso(identificador);
    if (!cliente) throw new Error(`No se encontró un cliente con ID o nombre "${identificador}".`);

    const documento = {
      esquema: 'gymcli.cliente-progreso.v1',
      exportado_en: new Date().toISOString(),
      cliente: cliente.datos,
      registros_avance: cliente.avances,
      planes_alimentacion: cliente.planes_nutricionales,
      planes_entrenamiento: cliente.planes_entrenamiento,
    };
    const nombreSeguro = cliente.datos.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || `id_${cliente.datos.id}`;
    await fs.mkdir(this.outputDir, { recursive: true });
    const archivo = path.join(this.outputDir, `cliente_${nombreSeguro}_progreso.json`);
    await fs.writeFile(archivo, `${JSON.stringify(documento, null, 2)}\n`, { encoding: 'utf8' });
    return archivo;
  }
}
