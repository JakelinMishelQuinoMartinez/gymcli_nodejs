import chalk from 'chalk';

export function logError(err) {
  console.error(chalk.red(`[ERROR] ${new Date().toISOString()} - ${err.message}`));
}

export function logInfo(msg) {
  console.log(chalk.cyan(`[INFO] ${msg}`));
}
