import { Endpoint, EndpointType, Logger } from '@matter/main';
import { BridgedDeviceBasicInformationServer } from '@matter/main/behaviors/bridged-device-basic-information';
import { OnOffLightDevice, OnOffLightRequirements } from '@matter/main/devices/on-off-light';
import { iocContainer } from '../HomeServer.js';
import { LoadsService } from '../wiser/LoadsService.js';
import { OnLoadEventHandler, WiserWsClient } from '../wiser/WiserWsClient.js';
import type { Load } from '../wiser/models/Load.js';
import { WiserDevice } from './WiserDevice.js';

const logger = Logger.get('LightDevice');

export class OnOffLightDeviceProxy extends WiserDevice {
  private readonly loadsService: LoadsService = iocContainer.get(LoadsService);
  private myEndpoint: Endpoint<OnOffLightDevice> | null = null;

  constructor(id: number, name: string) {
    super(id, name);
    iocContainer.get(WiserWsClient).addListener(this.onLoadEvent, id);
    logger.debug(`ID: ${this.id} LightDeviceProxy constructor called`);
  }

  override async addDevice<T extends EndpointType>(endpoint: Endpoint<T>): Promise<void> {
    logger.debug(`ID: ${this.id} LightDeviceProxy addDevice called`);

    this.myEndpoint = new Endpoint(OnOffLightDevice.with(BridgedDeviceBasicInformationServer, OnOffLightDeviceServer), {
      id: `wiser-${this.id}`,
      onOff: {
        onOff: true,
        deviceProxy: this,
        id: this.id,
      },
      bridgedDeviceBasicInformation: {
        nodeLabel: this.name,
        productName: 'wiser',
        productLabel: 'wiser-light',
        serialNumber: `node-matter-${this.id}`,
        reachable: true,
      },
    });

    await endpoint.add(this.myEndpoint);
  }

  onLoadEvent: OnLoadEventHandler = (load: Load): void => {
    try {
      this.lastLoad = load;
      if (this.myEndpoint && !this.actionPending) {
        const onOffValue = this.myEndpoint.state.onOff.onOff;
        if (load.state?.bri === 10000 && !onOffValue) {
          this.myEndpoint.set({ onOff: { onOff: true } }).then();
        } else if (load.state?.bri === 0 && onOffValue) {
          this.myEndpoint.set({ onOff: { onOff: false } }).then();
        }
      }
    } catch (error) {
      logger.error(`ID: ${this.getId()} LightDevice onLoadEvent: Error: ${error}`);
    }
    this.actionPending = false;
  };

  async on() {
    if (this.lastLoad.state?.bri === 10000) {
      logger.debug(`ID: ${this.getId()} LightDevice setLevel called with the same level`);
      return;
    }
    this.actionPending = true;
    logger.debug(`ID: ${this.getId()} LightDevice on called`);
    this.loadsService.putOn(this.id).then();
  }

  async off() {
    if (this.lastLoad.state?.bri === 0) {
      logger.debug(`ID: ${this.getId()} LightDevice setLevel called with the same level`);
      return;
    }
    this.actionPending = true;
    logger.debug(`ID: ${this.getId()} LightDevice off called`);
    this.loadsService.putOff(this.id).then();
  }
}

export class OnOffLightDeviceServer extends OnOffLightRequirements.OnOffServer {
  declare state: OnOffLightDeviceServer.State;

  override async on() {
    this.state.deviceProxy.on().then();
    super.on();
  }

  override async off() {
    this.state.deviceProxy.off().then();
    super.off();
  }
}

export namespace OnOffLightDeviceServer {
  export class State extends OnOffLightRequirements.OnOffServer.State {
    deviceProxy!: OnOffLightDeviceProxy;
    id!: number;
  }
}
