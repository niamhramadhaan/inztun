declare module '*.css' {}
declare module '*.svg' {}
declare module '*.png' {}
declare module '*.jpg' {}
declare module '*?url' {
  const src: string;
  export default src;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
