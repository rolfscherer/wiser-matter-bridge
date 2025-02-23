import { Endpoint, EndpointType, Logger, MaybePromise } from '@matter/main';
import { IdentifyServer } from '@matter/main/behaviors';
import { BridgedDeviceBasicInformationServer } from '@matter/main/behaviors/bridged-device-basic-information';
import { LevelControlServer } from '@matter/main/behaviors/level-control';
import { LevelControl } from '@matter/main/clusters';
import { DimmableLightDevice } from '@matter/main/devices/dimmable-light';
import { TypeFromPartialBitSchema } from '@matter/types';
import { iocContainer } from '../HomeServer.js';
import { LoadsService } from '../wiser/LoadsService.js';
import type { Load } from '../wiser/models/Load.js';
import { OnLoadEventHandler, WiserWsClient } from '../wiser/WiserWsClient.js';
import { WiserDevice } from './WiserDevice.js';

const logger = Logger.get('DimmableLightDevice');

export class DimmableLightDeviceProxy extends WiserDevice {
  private readonly loadsService: LoadsService = iocContainer.get(LoadsService);
  private myEndpoint: Endpoint<any> | null = null;
  private briMultiplier = 39.37007874015748;

  constructor(id: number, name: string) {
    super(id, name);
    iocContainer.get(WiserWsClient).addListener(this.onLoadEvent, id);
    logger.debug(`ID: ${this.getId()} LightDeviceProxy constructor called`);
  }

  override async addDevice<T extends EndpointType>(endpoint: Endpoint<T>): Promise<void> {
    logger.debug(`ID: ${this.getId()} LightDeviceProxy addDevice called`);

    this.myEndpoint = new Endpoint(DimmableLightDevice.with(BridgedDeviceBasicInformationServer, MyLevelControlServer, IdentifyServer), {
      id: `wiser-${this.id}`,
      onOff: {
        onOff: true,
      },

      bridgedDeviceBasicInformation: {
        nodeLabel: this.name,
        productName: 'wiser',
        productLabel: 'wiser-dim-light',
        serialNumber: `node-matter-${this.id}`,
        reachable: true,
      },
      levelControl: {
        currentLevel: 254,
        onLevel: 254,
        deviceProxy: this,
        id: this.id,
      },
    });

    await endpoint.add(this.myEndpoint);
  }

  onLoadEvent: OnLoadEventHandler = (load: Load): void => {
    try {
      this.lastLoad = load;
      if (load.state?.level) {
        logger.info(`ID: ${this.getId()} LightDeviceProxy onLoadEvent: Level: ${load.state?.level}`);
      }

      if (this.myEndpoint && !this.actionPending) {
        let level = Math.round((load.state?.bri ?? 0) / this.briMultiplier);
        const currentLevel = this.myEndpoint.state.levelControl.currentLevel;

        if (Math.abs(currentLevel - level) > 1) {
          logger.info(`ID: ${this.getId()} LightDeviceProxy onLoadEvent: Setting level to ${level}`);
          if (level <= 0) {
            this.myEndpoint.set({ onOff: { onOff: false } }).then();
          } else if (level >= 254) {
            this.myEndpoint.set({ onOff: { onOff: true } }).then();
          } else {
            this.myEndpoint.set({ levelControl: { currentLevel: level } }).then();
          }
        }
      }
    } catch (e) {
      logger.error(`ID: ${this.getId()} LightDeviceProxy onLoadEvent: error: ${e}`);
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

  async setLevel(level: number): Promise<void> {
    if (this.lastLoad.state?.bri === this.getBri(level)) {
      logger.debug(`ID: ${this.getId()} LightDevice setLevel called with the same level`);
      return;
    }
    this.actionPending = true;
    logger.debug(`ID: ${this.getId()} LightDevice moveToLevelWithOnOff called`);
    this.loadsService.putBri(this.id, this.getBri(level)).then();
  }

  getBri(level: number): number {
    const bri = Math.round(level * this.briMultiplier);
    if (bri < 0) {
      return 0;
    }
    if (bri > 10000) {
      return 10000;
    }
    return bri;
  }
}

export class MyLevelControlServer extends LevelControlServer {
  declare state: MyLevelControlServer.State;

  override setLevel(level: number, withOnOff: boolean, options?: TypeFromPartialBitSchema<typeof LevelControl.Options>): MaybePromise<void> {
    super.setLevel(level, withOnOff, { ...options });
    logger.debug(`Server setLevel: Light is now on level ${level} with withOnOff ${withOnOff}`);
    this.state.deviceProxy.setLevel(level).then();
  }

  override handleOnOffChange(onOff: boolean): MaybePromise<void> {
    logger.debug(`Server handleOnOffChange: with onOff ${onOff}`);
    if (onOff) {
      this.state.deviceProxy.on().then();
    } else {
      this.state.deviceProxy.off().then();
    }
    super.handleOnOffChange(onOff);
  }

  override moveToLevelWithOnOff({ level, transitionTime, optionsMask, optionsOverride }: LevelControl.MoveToLevelRequest): MaybePromise<void> {
    logger.debug(`Server moveToLevelWithOnOff: Light is now on level ${level} with transitionTime ${transitionTime}`);
    if (level > 0 && this.state.currentLevel === 0) {
      this.state.onLevel = level;
    } else if (level === 0) {
      this.state.onLevel = 254;
    }
    this.state.deviceProxy.setLevel(level).then();
    return super.moveToLevelWithOnOff({ level, transitionTime, optionsMask, optionsOverride });
  }

  override moveToLevel({ level, transitionTime, optionsMask, optionsOverride }: LevelControl.MoveToLevelRequest): MaybePromise<void> {
    logger.debug(`Server moveToLevel: Light is now on level ${level} with transitionTime ${transitionTime}`);
    this.state.deviceProxy.setLevel(level).then();
    return super.moveToLevel({ level, transitionTime, optionsMask, optionsOverride });
  }
}

export namespace MyLevelControlServer {
  export class State extends LevelControlServer.State {
    deviceProxy!: DimmableLightDeviceProxy;
    id!: number;
  }
}
