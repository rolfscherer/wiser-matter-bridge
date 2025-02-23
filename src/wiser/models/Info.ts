export interface Info {
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
   * version of µGateway Bootloader `MAJOR.MINOR.PATCH`
   */
  boot?: string;
  /**
   * version of µGateway Hardware `MAJOR`
   */
  hw?: string;
}
