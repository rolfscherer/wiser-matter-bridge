import { Logger } from '@matter/main';
import { MovementDirection, MovementType, WindowCoveringServer } from '@matter/main/behaviors';
import { RollerShadeDeviceProxy } from './RollerShadeWithTilt.js';

const logger = Logger.get('RollerShadeDevice');

const LiftingWindowCoveringServer = WindowCoveringServer.with('Lift', 'AbsolutePosition', 'PositionAwareLift');

export class RollerShadeServer extends LiftingWindowCoveringServer {
  declare state: RollerShadeServer.State;

  override async handleMovement(type: MovementType, reversed: boolean, direction: MovementDirection, targetPercent100ths?: number) {
    logger.info(
      `ID: ${this.state.deviceProxy.getId()} RollerShadeServerWithTilt handleMovement called. Type: ${type} Reversed: ${reversed} Direction: ${direction} Target: ${targetPercent100ths}`
    );

    if (type === MovementType.Lift && targetPercent100ths) {
      logger.debug('Move Lift ', direction === MovementDirection.Open ? 'Open' : 'Close', `${targetPercent100ths / 100}%`);
      this.state.deviceProxy.setLevel(targetPercent100ths).then();
    }

    await super.handleMovement(type, reversed, direction, targetPercent100ths);
  }
}

export namespace RollerShadeServer {
  export class State extends LiftingWindowCoveringServer.State {
    deviceProxy!: RollerShadeDeviceProxy;
    id!: number;
  }
}
