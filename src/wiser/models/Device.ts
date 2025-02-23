import { DeviceExtendedPropertiesInputsInner } from './DeviceExtendedPropertiesInputsInner.js';
import { DeviceExtendedPropertiesOutputsInner } from './DeviceExtendedPropertiesOutputsInner.js';
import { DevicePropertiesA } from './DevicePropertiesA.js';
import { DevicePropertiesC } from './DevicePropertiesC.js';

export interface Device {
  /**
   * [read-only] unique id of a device
   */
  id?: string;
  /**
   * [read-only] last seen counter (in seconds)
   */
  last_seen?: number;
  a?: DevicePropertiesA;
  c?: DevicePropertiesC;
  /**
   * [read-only] describes the input elements
   */
  inputs?: Array<DeviceExtendedPropertiesInputsInner>;
  /**
   * [read-only] describes the output elements
   */
  outputs?: Array<DeviceExtendedPropertiesOutputsInner>;
}
