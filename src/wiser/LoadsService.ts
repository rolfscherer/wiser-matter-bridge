import { Logger } from '@matter/main';
import { Mutex } from 'async-mutex';
import { inject, injectable } from 'inversify';
import { Bri, Motor } from '../web_server/controllers/LoadsController.js';
import type { Load, TargetState } from './models/Load.js';
import { ResponseWrapper, WiserRestClient } from './WiserRestClient.js';
import { OnLoadEventHandler, WiserWsClient } from './WiserWsClient.js';

@injectable()
export class LoadsService {
  logger = new Logger('LoadsService');
  private mutex = new Mutex();

  loads: Load[] = [];
  loadsMap: Map<number, Load> = new Map<number, Load>();

  constructor(
    @inject(WiserRestClient) public readonly wiserRestClient: WiserRestClient,
    @inject(WiserWsClient) public readonly wiserWsClient: WiserWsClient
  ) {
    this.wiserWsClient.addAllEventsListener(this.onLoadEvent);
  }

  public async putOn(id: number): Promise<ResponseWrapper<TargetState>> {
    const bri: Bri = { bri: 10000 };
    return this.setTargetState(id, bri);
  }

  public async putOff(id: number): Promise<ResponseWrapper<TargetState>> {
    const bri: Bri = { bri: 0 };
    return this.setTargetState(id, bri);
  }

  public async putBri(id: number, level: number): Promise<ResponseWrapper<TargetState>> {
    const bri: Bri = { bri: level };
    return this.setTargetState(id, bri);
  }

  public async putTilt(id: number, tilt: number) {
    const motor: Motor = { tilt: tilt };
    return this.setTargetState(id, motor);
  }

  public async putLevel(id: number, level: number) {
    const motor: Motor = { level: level };
    return this.setTargetState(id, motor);
  }

  private async setTargetState(id: number, payload: Bri | Motor): Promise<ResponseWrapper<TargetState>> {
    const url = `/loads/${id}/target_state`;
    return this.wiserRestClient!.put2<Bri | Motor, TargetState>(url, payload);
  }

  public async refresh(): Promise<void> {
    await this.mutex.runExclusive(async () => {
      this.loadsMap.clear();
      await this.getLoads();
      await this.getLoadsStates();
      this.logger.info('Loads cache refreshed');
    });
  }

  public async updateStats(): Promise<void> {
    await this.mutex.runExclusive(async () => {
      await this.getLoadsStates();
    });
  }

  public async getLoadsFromCache(): Promise<Load[]> {
    return await this.mutex.runExclusive(async () => {
      if (this.loads.length === 0) {
        await this.refresh();
      }
      return this.loads;
    });
  }

  private async getLoadsStates(): Promise<void> {
    const url = `/loads/state`;
    await this.wiserRestClient!.get<Load[]>(url).then(response => {
      if (response.data) {
        response.data.forEach(load => {
          const loadFromCache = this.loadsMap.get(load.id!);
          if (loadFromCache) {
            loadFromCache.state = load.state;
          }
        });
        this.wiserWsClient.sendLoadEvens(response.data);
      }
    });
  }

  private async getLoads(): Promise<void> {
    const url = `/loads`;
    await this.wiserRestClient!.get<Load[]>(url).then(response => {
      if (response.data) {
        this.logger.info('Loads cache invalidated');
        this.loads = response.data;
        this.loads.forEach(load => {
          this.loadsMap.set(load.id!, load);
        });
      }
    });
  }

  onLoadEvent: OnLoadEventHandler = (load: Load): void => {
    if (load && load.id) {
      const loadFromCache = this.loadsMap.get(load.id);
      if (loadFromCache) {
        loadFromCache.state = load.state;
      } else {
        this.logger.warn(`Load with id ${load.id} not found! ${JSON.stringify(load)}`);
      }
    }
  };
}
