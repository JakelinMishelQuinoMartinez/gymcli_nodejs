import chalk from 'chalk';

export const rosa = chalk.hex('#FF6FB5');
export const morado = chalk.hex('#A855F7');
export const amarillo = chalk.hex('#FFD60A');
export const celeste = chalk.hex('#38BDF8');
export const fucsia = chalk.hex('#E0218A');
const verde = chalk.hex('#2ECC71');
const rojoSuave = chalk.hex('#FF5C5C');

export const LINEA_DOBLE = '='.repeat(58);
export const LINEA_ESTRELLA = '*'.repeat(58);
export const LINEA_SIMPLE = '-'.repeat(58);

export function tituloMenu(texto) {
  console.log('\n' + morado.bold(LINEA_DOBLE));
  console.log(morado.bold(`   ${texto}`));
  console.log(morado.bold(LINEA_DOBLE));
}

export function subtitulo(texto) {
  console.log(celeste(`\n${LINEA_SIMPLE}`));
  console.log(celeste.bold(`  ${texto}`));
  console.log(celeste(LINEA_SIMPLE));
}

export function exito(texto) { console.log(verde(`✔ ${texto}`)); }
export function error(texto) { console.log(rojoSuave(`✖ ${texto}`)); }
export function aviso(texto) { console.log(amarillo(`⚠ ${texto}`)); }
export function info(texto) { console.log(fucsia(texto)); }
export function dato(texto) { console.log(rosa(texto)); }
