import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.budgetapp.mobile',
  appName: 'Budget App',
  webDir: '../frontend/dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3B82F6', // Toss Blue
      showSpinner: false,
      androidSpinnerStyle: 'small',
      spinnerColor: '#FFFFFF'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#3B82F6' // Toss Blue
    },
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;
