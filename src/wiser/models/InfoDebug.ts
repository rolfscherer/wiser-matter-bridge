export interface InfoDebug {
  /**
   * product name
   */
  product?: string;
  /**
   * unique Nubes Cloud instance ID of µGateway
   */
  instance_id?: number;
  /**
   * serial number of µGateway
   */
  sn?: string;
  /**
   * version of µGateway ReST API `MAJOR.MINOR`
   */
  api?: string;
  /**
   * version of µGateway Software `MAJOR.MINOR.PATCH`
   */
  sw?: string;
  /**
   * Git hash of µGateway Software
   */
  sw_git?: string;
  /**
   * build time of µGateway Software
   */
  sw_build?: string;
  /**
   * version of MicroPython
   */
  mpy?: string;
  /**
   * Git hash of MicroPython
   */
  mpy_git?: string;
  /**
   * version of µGateway Bootloader `MAJOR.MINOR.PATCH`
   */
  boot?: string;
  /**
   * version of µGateway Hardware `MAJOR`
   */
  hw?: string;
  /**
   * version of WLAN firmware
   */
  wlan?: string;
  /**
   * build time of WLAN firmware
   */
  wlan_build?: string;
}
