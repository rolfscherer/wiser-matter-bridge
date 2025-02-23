import { Logger } from '@matter/main';
import { Container, inject, injectable } from 'inversify';
import { initLogger } from './config/LoggerConfig.js';
import { Configuration } from './matter/Configuration.js';
import { DimmableLightDeviceProxy } from './matter/DimLight.js';
import { OnOffLightDeviceProxy } from './matter/Light.js';
import { RollerShadeDeviceProxy } from './matter/RollerShadeWithTilt.js';
import { SocketDeviceProxy } from './matter/Socket.js';
import { WiserBridge } from './matter/WiserBridge.js';
import { WiserDevice } from './matter/WiserDevice.js';
import { LoadsService } from './wiser/LoadsService.js';
import { Load } from './wiser/models/Load.js';
import { WiserRestClient } from './wiser/WiserRestClient.js';
import { type OnLoadEventHandler, WiserWsClient } from './wiser/WiserWsClient.js';
import { Config, DeviceTypes } from './config/Config.js';

const logger = new Logger('HomeServer');

@injectable()
class HomeServer {
  devices: Map<number, WiserDevice> = new Map();

  constructor(
    @inject(Config) public readonly config: Config,
    @inject(WiserWsClient) public readonly wiserWsClient: WiserWsClient,
    @inject(LoadsService) public readonly loadsService: LoadsService,
    @inject(WiserBridge) public readonly wiserBridge: WiserBridge
  ) {}

  public start(): void {
    try {
      this.startWebSocketClient();
      this.startLoadsService();
      this.startWiserBridge();
    } catch (error) {
      logger.error('Error starting HomeServer:', error);
    }
  }

  private startWiserBridge(): void {
    try {
      this.wiserBridge.createServerNode().then(
        () => {
          this.addDevices().then();
          this.wiserBridge.start().then(() => {
            logger.info('WiserBridge started');
          });
        },
        error => logger.error('Error starting WiserBridge:', error)
      );
    } catch (error) {
      logger.error('Error starting WiserBridge:', error);
    }
  }

  private async addDevices(): Promise<void> {
    const devices = this.config.getDevices();

    devices.forEach(device => {
      switch (device.type) {
        case DeviceTypes.Socket:
          this.devices.set(device.id, new SocketDeviceProxy(device.id, device.name));
          break;
        case DeviceTypes.OnOffLight:
          this.devices.set(device.id, new OnOffLightDeviceProxy(device.id, device.name));
          break;
        case DeviceTypes.DimmableLight:
          this.devices.set(device.id, new DimmableLightDeviceProxy(device.id, device.name));
          break;
        case DeviceTypes.RollerShutterWithTilt:
          this.devices.set(device.id, new RollerShadeDeviceProxy(device.id, device.name, true));
          break;
        case DeviceTypes.RollerShutter:
          this.devices.set(device.id, new RollerShadeDeviceProxy(device.id, device.name, false));
          break;
      }
      this.wiserBridge.addDevice(this.devices.get(device.id)!).then();
    });
  }

  private startWebSocketClient(): void {
    try {
      this.wiserWsClient.addAllEventsListener(this.onLoadEvent);
      this.wiserWsClient.connect();
    } catch (error) {
      logger.error('Error starting WebSocket client:', error);
    }
  }

  private startLoadsService(): void {
    try {
      this.loadsService.refresh().then();
    } catch (error) {
      logger.error('Error starting LoadsService:', error);
    }
  }

  onLoadEvent: OnLoadEventHandler = (load: Load): void => {
    logger.debug(JSON.stringify(load));
  };
}

export const iocContainer = new Container();

function initIoC(): void {
  iocContainer.bind(Config).toSelf().inSingletonScope();
  iocContainer.bind(WiserWsClient).toSelf().inSingletonScope();
  iocContainer.bind(WiserRestClient).toSelf().inSingletonScope();
  iocContainer.bind(LoadsService).toSelf().inSingletonScope();
  iocContainer.bind(HomeServer).toSelf().inSingletonScope();
  iocContainer.bind(Configuration).toSelf().inSingletonScope();
  iocContainer.bind(WiserBridge).toSelf().inSingletonScope();
}

async function main() {
  await initLogger();
  initIoC();
  const homeServer = await iocContainer.getAsync(HomeServer);
  homeServer.start();
  logger.info('Home server started');
}

main().catch(error => logger.error(error));
