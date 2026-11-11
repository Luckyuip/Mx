import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mxplayer.offline',
  appName: 'MX Offline',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  android: { allowMixedContent: true }
};

export default config;
