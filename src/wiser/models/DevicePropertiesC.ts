/**
 * [read-only] C-Block information
 */
export interface DevicePropertiesC {
  /**
   * [read-only] C Firmware project generates an image file (fhx) with a specific FWID.
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
   * [read-only] commercial reference. C-BLOCK Feller article number.
   */
  comm_ref?: string;
  /**
   * [read-only] command matrix selection defines the button functionality of C-Block.
   */
  cmd_matrix?: string;
  /**
   * [read-only] unique ID to identify the device in the Cloud
   */
  nubes_id?: number;
  /**
   * [read-only] commercial name. C-BLOCK Feller article name
   */
  comm_name?: string;
  /**
   * [read-only] unique Serialnumber (stored as a String), (max 31 Bytes)
   */
  serial_nr?: string;
}
