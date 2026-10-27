import notifee, {
  TriggerType,
  RepeatFrequency,
  TimestampTrigger,
  AndroidImportance,
  AndroidCategory,
  AlarmType,
} from '@notifee/react-native';

export interface Medicine {
  _id: string;
  name: string;
  dosage: string;
  time: string;
}

export const formatTimeStr = (date: Date): string => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

export const parseTimeStr = (tStr: string): { h: number; m: number } | null => {
  const match = tStr.trim().match(/(\d+):(\d+)\s+(AM|PM)/i);
  if (!match) return null;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12;
  if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
  return { h, m };
};

// Alarm rings for this many milliseconds then auto-dismisses
const ALARM_DURATION_MS = 60_000; // 1 minute

export const scheduleNotificationsForMed = async (med: Medicine) => {
  if (!med.time) return;
  const timeParts = med.time.split(', ');
  const now = new Date();

  for (let i = 0; i < timeParts.length; i++) {
    const parsed = parseTimeStr(timeParts[i]);
    if (!parsed) continue;

    const triggerTime = new Date(
      now.getFullYear(), now.getMonth(), now.getDate(),
      parsed.h, parsed.m, 0
    );
    if (triggerTime.getTime() <= now.getTime()) {
      triggerTime.setDate(triggerTime.getDate() + 1);
    }

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerTime.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
      alarmManager: {
        type: AlarmType.SET_ALARM_CLOCK,
      },
    };

    await notifee.createTriggerNotification(
      {
        id: `${med._id}-${i}`,
        title: 'Time for your Medicine! 💊',
        body: `It's time to take ${med.name} (${med.dosage})`,
        android: {
          channelId: 'alarms_custom',
          fullScreenAction: { id: 'default' },
          importance: AndroidImportance.HIGH,
          category: AndroidCategory.ALARM,
          pressAction: { id: 'default' },
          loopSound: true,
          timeoutAfter: ALARM_DURATION_MS,
        },
      },
      trigger,
    );
  }
};

export const cancelNotificationsForMed = async (medId: string, timeCount: number) => {
  for (let i = 0; i < timeCount; i++) {
    await notifee.cancelNotification(`${medId}-${i}`).catch(() => {});
  }
};
