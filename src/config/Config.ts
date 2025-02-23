import { promises } from 'fs';
import { parse } from 'yaml';
import { postConstruct } from 'inversify';
import axios from 'axios';

export interface MatterNetwork {
  port: number; // eg. 5541
  ethernetInterface?: string; // eg. 'eth0'
}

export enum DeviceTypes {
  Socket = 'Socket',
  OnOffLight = 'OnOffLight',
  DimmableLight = 'DimmableLight',
  RollerShutter = 'RollerShutter',
  RollerShutterWithTilt = 'RollerShutterWithTilt',
}

export interface Device {
  id: number; // Wiser ID
  name: string; // Matter-Name/Label
  type: DeviceTypes; // Matter-Device-Type
}

interface WiserNetwork {
  ipAddress: string;
  authToken: string;
}

export interface Config {
  wiserNetwork: WiserNetwork;
  matterNetwork: MatterNetwork;
  devices: Device[];
}

export class Config {
  private config: Config | undefined;

  constructor() {}

  @postConstruct()
  async init() {
    await this.loadFile();

    if (this.config?.wiserNetwork) {
      this._wiserRestUrl = `http://${this.config.wiserNetwork.ipAddress}/api`;
      this._wiserWsUrl = `ws://${this.config.wiserNetwork.ipAddress}/api`;
      this._wiserAuthToken = this.config.wiserNetwork.authToken;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${this._wiserAuthToken}`;

  }

  public async loadFile(): Promise<void> {
    const configContent = await promises.readFile('config.yaml', {
      encoding: 'utf8',
    });
    this.config = parse(configContent) as Config;
  }

  public getMatterNetwork(): MatterNetwork {
    return this.config?.matterNetwork || { port: 5541 };
  }

  public getDevices(): Device[] {
    return this.config?.devices || [];
  }

  // Wiser-API
  get wiserWsUrl(): string {
    return this._wiserWsUrl;
  }
  get wiserRestUrl(): string {
    return this._wiserRestUrl;
  }
  get wiserAuthToken(): string {
    return this._wiserAuthToken;
  }

  private _wiserAuthToken = 'Define the auth token in the wiser-config.yaml file';
  private _wiserRestUrl = 'http://192.168.0.100/api';
  private _wiserWsUrl = 'ws://192.168.0.100/api';
}
