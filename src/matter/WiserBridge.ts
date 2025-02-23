import { Endpoint, ServerNode, VendorId } from '@matter/main';
import { AggregatorEndpoint } from '@matter/main/endpoints/aggregator';
import { inject, injectable } from 'inversify';
import { Configuration } from './Configuration.js';
import { WiserDevice } from './WiserDevice.js';

@injectable()
export class WiserBridge {
  private serverNode: ServerNode | undefined = undefined;
  private endpoint: Endpoint | undefined = undefined;

  constructor(@inject(Configuration) public readonly configuration: Configuration) {
    this.addDevice = this.addDevice.bind(this);
  }

  public async createServerNode() {
    await this.configuration.init();

    this.serverNode = await ServerNode.create({
      // Unique Id of the node -> Required
      id: this.configuration.uniqueId,

      network: {
        // Optional when operating only one device on a host, Default port is 5540
        port: this.configuration.port,
      },
      //
      // // Provide Commissioning relevant settings
      commissioning: {
        passcode: this.configuration.passcode,
        discriminator: this.configuration.discriminator,
      },
      //
      // // Provide Node announcement settings
      // // Optional: If Omitted some development defaults are used
      productDescription: {
        name: this.configuration.deviceName,
        deviceType: AggregatorEndpoint.deviceType,
      },

      // Provide defaults for the BasicInformation cluster on the Root endpoint
      basicInformation: {
        vendorName: this.configuration.vendorName,
        vendorId: VendorId(this.configuration.vendorId!),
        nodeLabel: this.configuration.productName,
        productName: this.configuration.productName,
        productLabel: this.configuration.productName,
        productId: this.configuration.productId,
        serialNumber: `allerate-${this.configuration.uniqueId}`,
        uniqueId: this.configuration.uniqueId,
        hardwareVersion: 0.1,
        softwareVersion: 0.1,
      },
    });

    this.endpoint = new Endpoint(AggregatorEndpoint, { id: 'aggregator-1' });
    await this.serverNode.add(this.endpoint);
  }

  public async addDevice(device: WiserDevice) {
    await device.addDevice(this.endpoint!);
  }

  public async start() {
    await this.serverNode?.start();
  }

  public async run() {
    await this.serverNode?.run();
  }

  public async close() {
    await this.serverNode?.close();
  }
}
