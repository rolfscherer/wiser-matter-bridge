export interface GroupCtrl {
  /**
   * [read-only] unique id
   */
  id?: number;
  /**
   * [app-only] name of group-ctrl
   */
  name?: string;
  /**
   * [app-only] type of the group-ctrl: `light` or `blinds`
   */
  type?: string;
}
