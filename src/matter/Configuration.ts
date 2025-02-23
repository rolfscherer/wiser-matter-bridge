import { Environment, Logger, StorageService, Time } from '@matter/main';
import { inject, injectable } from 'inversify';
import { Config } from '../config/Config.js';

@injectable()
export class Configuration {
  logger = Logger.get('Configuration');

  constructor(@inject(Config) public readonly config: Config) {}

  get uniqueId(): string | undefined {
    return this._uniqueId;
  }

  get port(): number | undefined {
    return this._port;
  }

  get passcode(): number | undefined {
    return this._passcode;
  }

  get discriminator(): number | undefined {
    return this._discriminator;
  }

  get vendorId(): number | undefined {
    return this._vendorId;
  }

  get productId(): number | undefined {
    return this._productId;
  }

  get productName(): string | undefined {
    return this._productName;
  }

  get deviceName(): string | undefined {
    return this._deviceName;
  }

  get vendorName(): string | undefined {
    return this._vendorName;
  }

  public async init() {
    const environment = Environment.default;

    const matterNetwork = this.config.getMatterNetwork();

    if (matterNetwork.ethernetInterface) {
      environment.vars.set('mdns.networkInterface', matterNetwork.ethernetInterface);
    }

    const storageService = environment.get(StorageService);
    storageService.location = storageService.location + '/wiser-bridge';
    this.logger.debug(`Storage location: ${storageService.location} (Directory)`);
    const deviceStorage = (await storageService.open('bridge')).createContext('data');

    this._port = environment.vars.number('port') ? environment.vars.number('port') : matterNetwork.port;
    this._uniqueId = environment.vars.string('uniqueId') ?? (await deviceStorage.get('uniqueId', Time.nowMs().toString()));

    this._discriminator = environment.vars.number('discriminator') ?? (await deviceStorage.get('discriminator', 1966));
    this._passcode = environment.vars.number('passcode') ?? (await deviceStorage.get('passcode', 20202021));
    this._vendorId = environment.vars.number('vendorId') ?? (await deviceStorage.get('vendorId', 0xfff1));
    this._productId = environment.vars.number('productId') ?? (await deviceStorage.get('productId', 0x8001));

    this._productName = 'Wiser-Bridge V 0.1';
    this._deviceName = 'Matter Wiser-Bridge';
    this._vendorName = 'allerate.ch';

    this.logger.debug('Configuration initialized');

    await deviceStorage.set({
      passcode: this._passcode,
      discriminator: this._discriminator,
      vendorId: this._vendorId,
      productId: this._productId,
      uniqueId: this._uniqueId,
    });
  }

  private _uniqueId: string | undefined = undefined;
  private _port: number | undefined = undefined;
  private _passcode: number | undefined = undefined;
  private _discriminator: number | undefined = undefined;
  private _vendorId: number | undefined = undefined;
  private _productId: number | undefined = undefined;

  private _productName: string | undefined = undefined;
  private _deviceName: string | undefined = undefined;
  private _vendorName: string | undefined = undefined;
}
