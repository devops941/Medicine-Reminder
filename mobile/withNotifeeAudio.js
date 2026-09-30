const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to copy our custom alert.mp3 to the Android raw folder
 * so Notifee can use it for alarms.
 */
const withNotifeeAudio = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      // Your source MP3 file
      const srcPath = path.resolve(config.modRequest.projectRoot, 'assets/audio/freesound_community-alert-33762.mp3');
      // Android native raw folder
      const resPath = path.resolve(config.modRequest.platformProjectRoot, 'app/src/main/res/raw');
      
      // Ensure the raw folder exists
      if (!fs.existsSync(resPath)) {
        fs.mkdirSync(resPath, { recursive: true });
      }

      // Copy the file as "alert.mp3"
      // Notifee will reference this as "alert"
      fs.copyFileSync(srcPath, path.resolve(resPath, 'alert.mp3'));
      return config;
    },
  ]);
};

module.exports = withNotifeeAudio;
