import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.appchat.app',
  appName: 'AppChat',
  webDir: 'build',
  server: {
    androidScheme: 'http'
  }
};

export default config;
