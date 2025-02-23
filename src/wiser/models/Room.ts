export interface Room {
  /**
   * [read-only] unique id of the room
   */
  id?: number;
  /**
   * [app-only] name of the room
   */
  name?: string;
  /**
   * [app-only] kind of room (integer)
   */
  kind?: number;
  /**
   * [read write] order of loads within room
   */
  load_order?: Array<number>;
}
