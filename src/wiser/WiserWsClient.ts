import { Logger } from '@matter/main';
import { inject, injectable } from 'inversify';
import WebSocket from 'ws';
import type { Load, LoadEvent } from './models/Load.js';
import { Config } from '../config/Config.js';

export type OnLoadEventHandler = (load: Load) => void;

@injectable()
export class WiserWsClient {
  logger = new Logger('WiserWsClient');
  ws: WebSocket | null = null;
  allEventsListeners: OnLoadEventHandler[] = [];
  listeners: Map<number, OnLoadEventHandler> = new Map();
  close = false;
  pingTimeout: NodeJS.Timeout | null = null;

  constructor(@inject(Config) public readonly config: Config) {}

  private heartbeat(): void {
    if(this.pingTimeout) {
      clearTimeout(this.pingTimeout);
    }

    // The ping comes every 30 seconds. If there is no ping after 31 seconds, we establish a new connection.
    this.pingTimeout = setTimeout(() => {
      if(this.ws) {
        this.ws.terminate();
        this.ws = null;
      }
      this.connect();
    }, 30000 + 1000);
  }

  public connect(): void {
    if (this.ws) {
      this.disconnect();
    }

    if (!this.config.wiserWsUrl) {
      console.warn('Websocket url not available');
      return;
    }

    this.ws = new WebSocket(this.config.wiserWsUrl, { headers: { Authorization: `Bearer ${this.config.wiserAuthToken}` } });

    if (this.ws) {
      this.ws.on('open', () => {
        this.logger.info('Websocket connection opened');
        this.heartbeat();
      });

      this.ws.on('ping', () => {
        this.logger.debug('Ping received');
        this.heartbeat();
      });

      this.ws.on('close', (code: number) => {
        this.logger.info(`Websocket connection closed. Code: ${code}`);
        this.ws = null;
        if (!this.close) {
          this.connect();
        }
      });

      this.ws.on('error', async (code: number) => {
        this.logger.error(`Error in websocket. Code: ${code}.`);
        this.ws = null;
        if (!this.close) {
          this.logger.info(`Reconnecting...`);
          setTimeout(() => {
            this.connect();
          }, 1000);
        }
      });

      this.ws.on('message', (data: WebSocket.Data, isBinary: boolean) => {
        if (isBinary) {
          this.logger.error('Binary data not supported!');
        } else {
          const event: LoadEvent = JSON.parse(data.toString('utf8'));

          if (event.load.id) {
            const id = event.load.id.toString();
            if (event.load.state?.bri !== undefined) {
              this.logger.info(`ID: ${id.padStart(3)} Load event received. Load Brightness: ${event.load.state?.bri}`);
            } else {
              this.logger.info(
                `ID: ${id.padStart(3)} Load event received. Load Level: ${event.load.state?.level} Tilt: ${event.load.state?.tilt} Moving: ${event.load.state?.moving}`
              );
            }
            this.listeners.get(event.load.id)?.(event.load);
          }

          this.allEventsListeners.forEach(listener => listener(event.load));
        }
      });
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.close = true;
      this.ws.close();
      this.ws = null;
    }
  }

  addListener(listener: OnLoadEventHandler, id: number): void {
    this.listeners.set(id, listener);
  }

  addAllEventsListener(listener: OnLoadEventHandler): void {
    this.allEventsListeners.push(listener);
  }

  removeListener(id: number): void {
    this.listeners.delete(id);
  }

  clearListener(): void {
    this.listeners.clear();
  }

  sendLoadEvens(loads: Load[]): void {
    loads.forEach(load => {
      if (load.id) {
        this.listeners.get(load.id)?.(load);
      }
    });
  }
}
