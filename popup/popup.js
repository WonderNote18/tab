document.addEventListener('DOMContentLoaded', async () => {
  var tabUser;

  async function updateStorage() {
    await browser.storage.local.set({ tabUser });
    browser.runtime.sendMessage({ type: 'storageUpdated'});
    await getStorage();
  }

  async function getStorage() {
    const settings = await browser.storage.local.get('tabUser');
    tabUser = settings.tabUser;
  }

  async function updateEnabled(event) {
    const elementId = event.target.id;
    const timerName = elementId.split('Enabled')[0];
    var timer = tabUser.timers[timerName];

    timer.enabled = event.target.checked;
    if (timer.enabled) {
      const currentTime = Date.now();
      timer.nextNotification = setNotificationTime(currentTime, timer.duration);
    } else {
      timer.nextNotification = null;
    }

    await updateStorage();
    updateNotificationDisplay(timerName);
  }

  async function updateDuration(event) {
    const elementId = event.target.id;
    const timerName = elementId.split('Duration')[0];
    var timer = tabUser.timers[timerName];

    const newDuration = parseInt(event.target.value, 10) * 60000;
    if (!isNaN(newDuration)) {
      const currentTime = Date.now();
      timer.duration = newDuration;
      timer.nextNotification = setNotificationTime(currentTime, newDuration);
      await updateStorage();
      updateNotificationDisplay(timerName);
    }
  }

  async function updateAudioSetting(event) {
    tabUser.audioEnabled = event.target.checked;
    await updateStorage();
  }
  
  function applyPopupSettings() {
    for (const timerName in tabUser.timers) {
      var timer = tabUser.timers[timerName];
      var timerInputEnabled = document.getElementById(`${timerName}Enabled`);
      var timerInputDuration = document.getElementById(`${timerName}Duration`);

      timerInputEnabled.checked = timer.enabled;
      timerInputDuration.value = timer.duration / 60000;
      updateNotificationDisplay(timerName);

      timerInputEnabled.addEventListener('change', updateEnabled);
      timerInputDuration.addEventListener('change', updateDuration);
    }

    const audioToggle = document.getElementById('audioEnabled');
    audioToggle.checked = tabUser.audioEnabled;
    audioToggle.addEventListener('change', updateAudioSetting);
  }

  function updateNotificationDisplay(timerName) {
    var timer = tabUser.timers[timerName];
    const timerDisplayNextNotification = document.getElementById(`${timerName}Notification`)
    if (timer.nextNotification !== null && timer.enabled === true) {
      const notificationTime = new Date(timer.nextNotification);
      const formattedDate = notificationTime.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour12: true,
      });
      timerDisplayNextNotification.textContent = formattedDate;
      return;
    }

    timerDisplayNextNotification.textContent = `Not set`;
    return;
  }

  function setNotificationTime(currentTime, timerDuration) {
    const currentMinutes = Math.floor(currentTime / 60000);
    const currentSeconds = (currentTime % 60000) / 1000;
  
    // If seconds are over 30, add an additional minute
    const roundedMinutes = currentMinutes + (currentSeconds > 30 ? 1 : 0);
  
    const newTime = new Date((roundedMinutes * 60000) + timerDuration);
    return newTime;
  }

  // Listen for messages from the background script
  browser.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'updateNotification') {
      await getStorage();
      updateNotificationDisplay(message.timerName);
    }
  });

  await getStorage();
  applyPopupSettings();
});