type Listener = (message: string) => void;

const listeners = new Set<Listener>();

export const apiErrors = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  emit(message: string) {
    listeners.forEach((fn) => fn(message));
  },
};
