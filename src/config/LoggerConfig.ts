import { LogFormat, Logger, LogLevel } from '@matter/main';
import { createFileLogger } from '@matter/nodejs';
import path from 'path';

export async function initLogger(): Promise<void> {
  const currentDirectory = process.cwd();
  const filePath = path.join(currentDirectory, 'log.txt');

  if (process.stdin?.isTTY) Logger.format = LogFormat.ANSI;
  Logger.setDefaultLoglevelForLogger('default', LogLevel.DEBUG);

  Logger.addLogger('file', await createFileLogger(filePath), {
    defaultLogLevel: LogLevel.INFO,
    logFormat: LogFormat.PLAIN,
  });
}

export function setLogLevel(identifier: string, logLevel: LogLevel): void {
  Logger.setDefaultLoglevelForLogger(identifier, logLevel);
}
