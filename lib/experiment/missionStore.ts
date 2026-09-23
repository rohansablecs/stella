
export type MissionId =
  | "sample-handling"
  | "sample-transfer"
  | "tool-handling";

let activeMissionId: MissionId = "sample-handling";

const listeners = new Set<() => void>();

export function getActiveMissionId(): MissionId {
  return activeMissionId;
}

export function setActiveMissionId(id: MissionId) {
  if (activeMissionId === id) return;

  activeMissionId = id;

  for (const listener of listeners) {
    listener();
  }
}

export function subscribeMission(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
