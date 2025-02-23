import { Endpoint, EndpointType, Logger } from '@matter/main';
import { OnLoadEventHandler } from '../wiser/WiserWsClient.js';
import { Load } from '../wiser/models/Load.js';

const logger = Logger.get('WiserDevice');

export abstract class WiserDevice {
  lastAction = Date.now();

  private _actionPending = false;
  protected lastLoad: Load = { state: {} };

  protected constructor(
    protected id: number,
    protected name: string
  ) {
    setInterval(() => {
      try {
        if (this.actionPending && Date.now() - this.lastAction > 60000) {
          logger.error(`ID: ${this.getId()} action pending for more than 60 seconds. Setting actionPending to false`);
          this.actionPending = false;
        }
      } catch (e) {
        logger.error(`ID: ${this.getId()} Error checking action pending: ${e}`);
      }
    }, 5000);
  }

  get actionPending(): boolean {
    return this._actionPending;
  }

  set actionPending(value: boolean) {
    if (value) {
      this.lastAction = Date.now();
    }
    this._actionPending = value;
  }

  getId(): string {
    return this.id.toString().padStart(3, ' ');
  }

  abstract addDevice<T extends EndpointType>(endpoint: Endpoint<T>): Promise<void>;
  abstract onLoadEvent: OnLoadEventHandler;
}
