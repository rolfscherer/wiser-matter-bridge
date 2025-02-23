export interface LoadFlags {
  over_current?: number;
  under_current?: number;
  learning?: number;
  locked?: number;
  moving?: number;
  timeout?: number;
  direction?: number;
  fading?: number;
  over_temperature?: number;
}

export interface LoadState {
  level?: number;
  flags?: LoadFlags;
  tilt?: number;
  moving?: string;
  bri?: number;
}

export interface TargetState {
  id: number;
  target_state: LoadState;
}

export interface Load {
  id?: number;
  name?: string;
  unused?: boolean;
  type?: string;
  sub_type?: string;
  device?: string;
  channel?: number;
  room?: number;
  kind?: number;
  state?: LoadState;
}

export interface LoadEvent {
  load: Load;
}
