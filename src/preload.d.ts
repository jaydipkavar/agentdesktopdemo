
declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    storageAPI:  {
      set: (key: string, value: any) => void;
      get: (key: string) => any;
      clear: () => void;
    };
  }
}

export {};