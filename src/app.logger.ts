import 'colors';

export class AppLogger {
  log(message: any, ...optionalParams: any[]): void {
    console.log(message, ...optionalParams);
  }

  info(message: any, ...optionalParams: any[]): void {
    console.log('info'.blue, message, ...optionalParams);
  }

  success(message: any, ...optionalParams: any[]): void {
    console.error('success'.green, message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]): void {
    console.error('error'.red, message, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]): void {
    console.warn('warning'.yellow, message, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]): void {
    console.debug('debug'.cyan, message, ...optionalParams);
  }

  newline(): void {
    console.log();
  }

  update(message: any, ...optionalParams: any[]): void {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write([message, ...optionalParams].join(' '));
  }
}
