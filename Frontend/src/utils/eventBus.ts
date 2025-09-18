// src/utils/eventBus.ts
const eventBus = new EventTarget();

export const notifyEvent = (name: string, detail?: any) => {
  eventBus.dispatchEvent(new CustomEvent(name, { detail }));
};

export const listenEvent = (name: string, callback: (e: CustomEvent) => void) => {
  const handler = (e: Event) => callback(e as CustomEvent);
  eventBus.addEventListener(name, handler);
  return () => eventBus.removeEventListener(name, handler);
};
