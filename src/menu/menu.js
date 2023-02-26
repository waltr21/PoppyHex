let poppySettings = {};
const settingName = 'poppySettings';
const disable = document.getElementById('disable');
const disableForSite = document.getElementById('disableForSite');
const includeHash = document.getElementById('includeHash');
const sixDigit = document.getElementById('sixDigit');
const includeHashThree = document.getElementById('includeHashThree');
loadSettings();
setListeners();

function setListeners(){
  const basicChecks = [disable, includeHash, sixDigit, includeHashThree];

  basicChecks.forEach(check => {
    check.addEventListener('change', function() {
      updateBasicSetting(check.id, check.checked);
    });
  });

  disableForSite.addEventListener('change', function() {
    updateBlacklist(disableForSite.checked);
  });
}

async function loadSettings(){
  const res = await browser.storage.sync.get('poppySettings');
  poppySettings = res.poppySettings;
  poppySettings = poppySettings ? JSON.parse(poppySettings) : {};

  console.log('Loaded: ', poppySettings);

  const basicChecks = [disable, includeHash, sixDigit, includeHashThree];
  basicChecks.forEach(check => {
    check.checked = poppySettings[check.id];
  });
}

function updateBasicSetting(key, val){
  console.log(`${key}, ${val}`);
  poppySettings[key] = val;
  //localStorage.setItem(settingName, JSON.stringify(poppySettings));
  browser.storage.sync.set({
    poppySettings: JSON.stringify(poppySettings)
  });
  console.log(poppySettings);
}

async function updateBlacklist(val){
  const host = await getPage();
  console.log('HOST: ', host);
  const blacklist = poppySettings.blacklist ? poppySettings.blacklist : [];
  const index = blacklist.indexOf(host);
  if (val){
    // Make sure it is not already added. Else just ignore.
    if (index < 0){
      blacklist.push(host);
    }
  } else {
    if (index >= 0){
      blacklist.splice(index, 1);
    }
  }

  poppySettings.blacklist = blacklist;

  browser.storage.sync.set({
    poppySettings: JSON.stringify(poppySettings)
  });
  console.log(poppySettings);
}

// https://stackoverflow.com/questions/11594576/getting-current-browser-url-in-firefox-addon
async function getPage(){
  const res = await browser.tabs.query({currentWindow: true, active: true});
  const url = new URL(res[0].url);
  return url.hostname;
}