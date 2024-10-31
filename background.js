var tabUser = {
  audioEnabled: true,
  timers: {
    vision: {
      enabled: true,
      duration: 1200000,
      nextNotification: null
    },
    posture: {
      enabled: true,
      duration: 1800000,
      nextNotification: null
    },
    stretch: {
      enabled: true,
      duration: 2700000,
      nextNotification: null
    },
    hydration: {
      enabled: true,
      duration: 3600000,
      nextNotification: null
    }
  }
};

const timerMessages = {
  vision: {
    messages: [
      "Give those eyes a rest! Look at something 20 feet away for 20 seconds 🌄",
      "Eyes feeling tired? Take a sec to refocus and relax your gaze 👀",
      "A quick look away keeps your eyes focused! Regular breaks reduce the risk of nearsightedness 📏",
      "Quick eye reset: Look away from the screen and let your focus drift 🌅",
      "Did you know? The 20-20-20 rule helps reduce digital eye strain by up to 80% 📉",
      "Blink it out! Look around to ease your vision 👓",
      "Eye strain prevention tip: Staring at screens too long can lead to dry eyes and blurred vision 👓",
      "Take a breath and let your eyes wander to something far away 🌌",
      "Screen fatigue fact: Studies show 60% of adults suffer from eye strain. Breaks can ease the load 👁️",
    ]
  },
  posture: {
    messages: [
      "Check-in time! Adjust your posture and take a deep breath 🧘‍♂️",
      "Water fact: Staying hydrated can improve cognitive performance by up to 30% 📊",
      "Your back will thank you! Sit up straight and stretch if you can 🙌",
      "Gentle reminder: Align your back, drop your shoulders, relax your jaw 🌿",
      "Hydration matters! Studies show even mild dehydration can lead to a dip in focus and memory 💧",
      "Shake off the tension! Straighten up and relax 😌",
      "A sip of water can go a long way! Hydration is key for energy and mental clarity 🧠",
      "Time for a posture reset—feel the ease in your spine 🌱",
      "Did you know? Drinking enough water can reduce headaches and improve mood by 20% ☀️",
    ]
  },
  stretch: {
    messages: [
      "Stand, stretch, breathe—let’s get that blood flowing 🏃‍♂️",
      "Pro tip: Moving every hour lowers the risk of circulation problems and muscle stiffness 🚶‍♀️",
      "Take a moment to move! Stretch it out and shake it off 🌈",
      "Stretching improves blood flow and boosts energy levels—perfect for avoiding the afternoon slump 🕔",
      "Feel the flow—stand, stretch, and loosen up 🙆‍♀️",
      "Studies show standing every 30 mins helps lower the risk of cardiovascular issues by 25% ❤️",
      "Stretch break! A few moves to reset your energy 🌿",
      "Up you go! Move around for a fresh boost of energy 🌄",
      "Movement matters! Even small stretches help reduce risk of back pain and joint stiffness 🧘‍♂️",
    ]
  },
  hydration: {
    messages: [
      "Sip break! A little hydration goes a long way 💧",
      "Water fact: Staying hydrated can improve cognitive performance by up to 30% 📊",
      "Time to drink up! Grab a glass of water and refresh 💦",
      "Hydration matters! Studies show even mild dehydration can lead to a dip in focus and memory 🚰",
      "Keep your mind sharp—pause and hydrate 🥤",
      "A sip of water can go a long way! Hydration is key for energy and mental clarity 🧠",
      "Stay cool and hydrated—your body will thank you 🌊",
      "Water break! A few sips to keep you focused 🥤",
      "Did you know? Drinking enough water can reduce headaches and improve mood by 20% ☀️",
    ]
  }
};

var notificationQueue = [];
var isNotificationActive = false;

function setNotificationTime(currentTime, timerDuration) {
  const currentMinutes = Math.floor(currentTime / 60000);
  const currentSeconds = (currentTime % 60000) / 1000;

  // If seconds are over 30, add an additional minute
  const roundedMinutes = currentMinutes + (currentSeconds > 30 ? 1 : 0);

  const newTime = new Date((roundedMinutes * 60000) + timerDuration);
  return newTime;
}

async function showNotification(timerName, timerMessage, currentTime) {
  notificationQueue.push({ timerName, timerMessage, currentTime });
  await processNotificationQueue();
}

async function processNotificationQueue() {
  if (isNotificationActive || notificationQueue.length === 0) {
    return;
  }

  isNotificationActive = true;
  const { timerName, timerMessage, currentTime } = notificationQueue.shift();

  const notificationId = `timer-${timerName}-${currentTime}`;
  const properTimerName = timerName.charAt(0).toUpperCase() + timerName.substring(1).toLowerCase();

  browser.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: browser.runtime.getURL('icons/mindul-128.png'),
    title: `TAB: ${properTimerName} break!`,
    message: timerMessage
  });
  
  if (tabUser.audioEnabled === true) {
    const audio = new Audio(browser.runtime.getURL('audio/tabNotification.mp3'));
    audio.play();
  }

  try {
    await browser.runtime.sendMessage({ type: 'updateNotification', timerName });
  } catch (error) {}

  setTimeout(() => {
    isNotificationActive = false;
    processNotificationQueue();
  }, 7000); // 7-second delay before processing the next notification

  setTimeout(() => {
    browser.notifications.clear(notificationId);
  }, 3600000); // 1-hour delay before clearing the notification
}

async function loadSettings() {
  try {
    const loadResult = await browser.storage.local.get('tabUser');
    const storedUser = loadResult.tabUser;

    if (!storedUser || typeof storedUser !== 'object') {
      throw new Error('User settings corrupted or missing');
    }
    
    for (const key in tabUser) {
      if (!(key in storedUser)) {
        throw new Error(`Setting ${key} not found in user settings`);
      }
    }

    console.log('Settings loaded!');
    return storedUser;
  } catch (error) {
    throw error;
  }
}

async function initSettings() {
  try {
    const currentTime = Date.now();
    var initUser = JSON.parse(JSON.stringify(tabUser));

    for (const timerName in initUser.timers) {
      var timer = initUser.timers[timerName];
      timer.nextNotification = setNotificationTime(currentTime, timer.duration);
    }
    
    await browser.storage.local.set({ tabUser: initUser });
    return;
  } catch (error) {
    console.error('Error initializing settings:\n', error);
    return;
  }
}

async function init() {
  try {
    const settings = await loadSettings();
    console.log('Settings loaded:', settings);
    return settings;
  } catch (error) {
    console.warn('Loading settings failed, initializing with default settings.');
    await initSettings();
    return tabUser;
  }
}

async function tabApp() {
  tabUser = await init();
  console.log('Settings initialized!');

  setInterval(async () => {
    const currentTime = Date.now();
    
    for (const timerName in tabUser.timers) {
      var timer = tabUser.timers[timerName];
      
      // Enabled timer check
      if (timer.enabled) {
        if (timer.nextNotification === null) {
          timer.nextNotification = setNotificationTime(currentTime, timer.duration);
        } else {
          const nextNotificationTime = new Date(timer.nextNotification).getTime();

          if (currentTime > (nextNotificationTime + 7200000)) {
            console.log(`Resetting timer ${timerName} due to long inactivity.`);
            timer.nextNotification = setNotificationTime(currentTime, timer.duration);
            await browser.storage.local.set({ tabUser });
          }
          else if (currentTime >= timer.nextNotification) {
            const messageList = timerMessages[timerName].messages;
            const timerMessage = messageList[Math.floor(Math.random() * messageList.length)];

            timer.nextNotification = setNotificationTime(currentTime, timer.duration);
            await browser.storage.local.set({ tabUser });
            await showNotification(timerName, timerMessage, currentTime);
          }
        }

      // Disabled timer check
      } else {
        if (timer.nextNotification !== null) {
          timer.nextNotification = null;
          await browser.storage.local.set({ tabUser });
        }
      }
    }
  }, 1000);
}

browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'storageUpdated') {
    const settings = await browser.storage.local.get('tabUser');
    tabUser = settings.tabUser;
  }
});
browser.runtime.onInstalled.addListener(tabApp);
browser.runtime.onStartup.addListener(tabApp);