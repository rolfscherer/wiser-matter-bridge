import { Endpoint, EndpointType, Logger } from '@matter/main';
import { MovementDirection, MovementType, WindowCoveringServer } from '@matter/main/behaviors';
import { BridgedDeviceBasicInformationServer } from '@matter/main/behaviors/bridged-device-basic-information';
import { WindowCovering } from '@matter/main/clusters';
import { WindowCoveringDevice } from '@matter/main/devices';
import { iocContainer } from '../HomeServer.js';
import { LoadsService } from '../wiser/LoadsService.js';
import { OnLoadEventHandler, WiserWsClient } from '../wiser/WiserWsClient.js';
import type { Load } from '../wiser/models/Load.js';
import { RollerShadeServer } from './RollerShade.js';
import { WiserDevice } from './WiserDevice.js';
import WindowCoveringType = WindowCovering.WindowCoveringType;

const logger = Logger.get('RollerShadeDeviceWithTilt');

export class RollerShadeDeviceProxy extends WiserDevice {
  private readonly loadsService: LoadsService = iocContainer.get(LoadsService);
  private myEndpoint: Endpoint<WindowCoveringDevice> | null = null;

  constructor(
    id: number,
    name: string,
    private tilt = true
  ) {
    super(id, name);
    iocContainer.get(WiserWsClient).addListener(this.onLoadEvent, id);
    logger.debug(`ID: ${this.id} RollerShadeDeviceProxy constructor called`);
  }

  override async addDevice<T extends EndpointType>(endpoint: Endpoint<T>): Promise<void> {
    logger.debug(`ID: ${this.id} RollerShadeDeviceProxy addDevice called`);

    if (this.tilt) {
      this.myEndpoint = new Endpoint(WindowCoveringDevice.with(BridgedDeviceBasicInformationServer, RollerShadeServerWithTilt), {
        id: `wiser-${this.id}`,
        windowCovering: {
          type: WindowCovering.WindowCoveringType.TiltBlindLift,
          endProductType: WindowCovering.EndProductType.RollerShutter,
          deviceProxy: this,
          id: this.id,
          configStatus: {
            operational: true,
            onlineReserved: true,
            liftMovementReversed: false,
            liftPositionAware: true,
            tiltPositionAware: true,
            liftEncoderControlled: false,
            tiltEncoderControlled: false,
          },
          installedOpenLimitTilt: 0,
          installedClosedLimitTilt: 900,
        },
        bridgedDeviceBasicInformation: {
          nodeLabel: this.name,
          productName: 'wiser',
          productLabel: 'wiser-roller-shade',
          serialNumber: `node-matter-${this.id}`,
          reachable: true,
        },
      });
    } else {
      this.myEndpoint = new Endpoint(WindowCoveringDevice.with(BridgedDeviceBasicInformationServer, RollerShadeServer), {
        id: `wiser-${this.id}`,
        windowCovering: {
          type: WindowCoveringType.RollershadeExterior,
          endProductType: WindowCovering.EndProductType.RollerShutter,
          deviceProxy: this,
          id: this.id,
          configStatus: {
            operational: true,
            onlineReserved: true,
            liftMovementReversed: false,
            liftPositionAware: true,
            tiltPositionAware: true,
            liftEncoderControlled: false,
            tiltEncoderControlled: false,
          },
        },
        bridgedDeviceBasicInformation: {
          nodeLabel: this.name,
          productName: 'wiser',
          productLabel: 'wiser-roller-shade',
          serialNumber: `node-matter-${this.id}`,
          reachable: true,
        },
      });
    }

    await endpoint.add(this.myEndpoint);
  }

  // @ts-ignore
  onLoadEvent: OnLoadEventHandler = (load: Load): void => {
    try {
      this.lastLoad = load;
      if (load.state?.level != undefined && this.tilt) {
        logger.info(`ID: ${this.getId()} RollerShadeDevice onLoadEvent: Level: ${load.state?.level} Tilt: ${load.state?.tilt}`);
      } else {
        logger.info(`ID: ${this.getId()} RollerShadeDevice onLoadEvent: Level: ${load.state?.level}`);
      }

      if (!this.actionPending && this.myEndpoint && load.state?.moving === 'stop') {
        // @ts-ignore
        const currentPositionLiftPercent100ths = this.myEndpoint.state.windowCovering.currentPositionLiftPercent100ths;
        // @ts-ignore
        const currentPositionTiltPercent100ths = this.myEndpoint.state.windowCovering.currentPositionTiltPercent100ths;

        if (load.state?.level != undefined && currentPositionLiftPercent100ths !== load.state?.level) {
          logger.info(`ID: ${this.getId()} RollerShadeDevice onLoadEvent: Setting level to ${load.state?.level}`);
          // @ts-ignore
          this.myEndpoint.set({ windowCovering: { currentPositionLiftPercent100ths: load.state?.level } }).then();
        }
        if (this.tilt && load.state?.tilt != undefined && this.getTiltFromMatter(currentPositionTiltPercent100ths) !== load.state?.tilt) {
          logger.info(`ID: ${this.getId()} RollerShadeDevice onLoadEvent: Setting tilt to ${load.state?.tilt}`);
          // @ts-ignore
          this.myEndpoint.set({ windowCovering: { currentPositionTiltPercent100ths: this.getTiltFromWiser(load.state?.tilt) } }).then();
        }
      }
    } catch (e) {
      logger.error(`ID: ${this.getId()} RollerShadeDevice onLoadEvent: Error: ${e}`);
    }
    if (load.state?.moving === undefined || load.state?.moving === 'stop') {
      this.actionPending = false;
    }
  };

  async setTilt(tilt: number) {
    const tiltValue = this.getTiltFromMatter(tilt, 1000);
    if (this.lastLoad.state?.tilt === tiltValue) {
      return;
    }
    this.actionPending = true;
    logger.info(`ID: ${this.getId()} Roller shade set the tilt value to ${tiltValue}`);
    await this.loadsService.putTilt(this.id, tiltValue);
  }

  async setLevel(level: number) {
    if (this.lastLoad.state?.level === level) {
      return;
    }
    this.actionPending = true;
    logger.info(`ID: ${this.getId()} Roller shade set the level to ${level}`);
    await this.loadsService.putLevel(this.id, level);
  }

  getTiltFromMatter(value: number, div = 20): number {
    const tilt = Math.round(value / div);
    if (tilt > 9) {
      return 9;
    }
    return tilt;
  }

  getTiltFromWiser(value: number): number {
    const tilt = Math.round(value * 111.11111111111111);
    if (tilt > 10000) {
      return 10000;
    }
    return tilt;
  }
}

const LiftingWindowCoveringServerWithTilt = WindowCoveringServer.with('Lift', 'Tilt', 'AbsolutePosition', 'PositionAwareLift', 'PositionAwareTilt');

export class RollerShadeServerWithTilt extends LiftingWindowCoveringServerWithTilt {
  declare state: RollerShadeServerWithTilt.State;

  override async handleMovement(type: MovementType, reversed: boolean, direction: MovementDirection, targetPercent100ths?: number) {
    logger.info(
      `ID: ${this.state.deviceProxy.getId()} RollerShadeServerWithTilt handleMovement called. Type: ${type} Reversed: ${reversed} Direction: ${direction} Target: ${targetPercent100ths}`
    );

    if (type === MovementType.Lift && targetPercent100ths !== undefined) {
      logger.debug('Move Lift ', direction === MovementDirection.Open ? 'Open' : 'Close', `${targetPercent100ths / 100}%`);
      this.state.deviceProxy.setLevel(targetPercent100ths).then();
    } else if (targetPercent100ths !== undefined) {
      logger.debug('Set tilt ', direction === MovementDirection.Open ? 'Open' : 'Close', `${targetPercent100ths / 100}%`);
      this.state.deviceProxy.setTilt(targetPercent100ths).then();
    }

    await super.handleMovement(type, reversed, direction, targetPercent100ths);
  }
}

export namespace RollerShadeServerWithTilt {
  export class State extends LiftingWindowCoveringServerWithTilt.State {
    deviceProxy!: RollerShadeDeviceProxy;
    id!: number;
  }
}
