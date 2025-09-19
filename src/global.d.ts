// src/global.d.ts

interface StorageAPI {
    set: (key: string, value: any) => void;
    get: (key: string) => any;
    clear: () => void;
}

interface ElectronAPI {
    ping: (msg: any) => void;
    onPong: (callback: (response: any) => void) => void;
    launchPlaywright: (
        url: string
    ) => Promise<{ success: boolean; message: string }>;
    closePlaywright: () => Promise<{ success: boolean; message: string }>;
    getPageContent: () => Promise<{
        content: string;
        width: number;
        height: number;
        url: string;
    }>;
    performAction: (
        actionObj: PerformActionPayload
    ) => Promise<{ success: boolean; message?: string }>;
    performActionNew: (
        actionObj: PerformActionPayload
    ) => Promise<{ success: boolean; message?: string }>;
    captureScreenshot: () => Promise<string>;
    waitForPage: () => Promise<{ success: boolean; message?: string }>;
    setViewportSize: (viewport: {
        width: number;
        height: number;
    }) => Promise<{ success: boolean; message: string }>;
}

interface PerformActionPayload {
    action: string;
    final_xpath: string;
    keyboard_input?: string;
    [key: string]: any;
}

interface API {
    fetch: (
        url: string,
        options?: any
    ) => Promise<{ ok: boolean; data?: any; error?: string }>;
}

interface Window {
    storageAPI: StorageAPI;
    electronAPI: ElectronAPI;
    api: API;
}
