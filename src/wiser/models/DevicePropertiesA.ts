/**
 * [read-only] A-Block information
 */
export interface DevicePropertiesA {
  /**
   * [read-only] A Firmware project generates an image file (fhx) with a specific FWID.
   */
  fw_id?: string;
  /**
   * [read-only] Hardware ID, actual assembly variant, defined by the HWID Resistor on the PCBA.
   */
  hw_id?: string;
  /**
   * [read-only] firmware Version, consists of Major, Minor, Patch and Build Number.
   */
  fw_version?: string;
  /**
   * [read-only] commercial reference. A-BLOCK Feller article number.
   */
  comm_ref?: string;
  /**
   * [read-only] unique 28-Bit K+ Address
   */
  address?: string;
  /**
   * [read-only] unique ID to identify the device in the Cloud
   */
  nubes_id?: number;
  /**
   * [read-only] commercial name. A-BLOCK Feller article name
   */
  comm_name?: string;
  /**
   * [read-only] Unique Serialnumber (stored as a String), (max 31 Bytes)
   */
  serial_nr?: string;
}
