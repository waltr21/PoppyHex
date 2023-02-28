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

async function setUIHelpers(){
  const el = document.getElementById('host-name');
  el.innerText = await getPage();

  let validExamples = ['#5f4b8a', '5f4b8a', '#5f4', '5f4'];
  const validEl = document.getElementById('valid-codes');

  if (poppySettings.includeHash){
    spliceHelper(validExamples, validExamples.indexOf('5f4b8a'));
    spliceHelper(validExamples, validExamples.indexOf('5f4'));
  }

  if (poppySettings.sixDigit){
    spliceHelper(validExamples, validExamples.indexOf('#5f4'));
    spliceHelper(validExamples, validExamples.indexOf('5f4'));
  }

  if (poppySettings.includeHashThree){
    spliceHelper(validExamples, validExamples.indexOf('5f4'));
  }

  validEl.innerText = validExamples.join(', ');
}

function spliceHelper(arr, index){
  if (index < 0) return;
  arr.splice(index,1);
}

async function loadSettings(){
  const res = await browser.storage.sync.get('poppySettings');
  poppySettings = res.poppySettings;
  poppySettings = poppySettings ? JSON.parse(poppySettings) : {};

  const basicChecks = [disable, includeHash, sixDigit, includeHashThree];
  basicChecks.forEach(check => {
    check.checked = poppySettings[check.id];
  });

  const blacklist = poppySettings.blacklist ? poppySettings.blacklist : [];
  const hostName = await getPage();
  if (blacklist.indexOf(hostName) >= 0){
    disableForSite.checked = true;
  } else {
    disableForSite.checked = false;
  }

  setUIHelpers();
}

function updateBasicSetting(key, val){
  poppySettings[key] = val;
  browser.storage.sync.set({
    poppySettings: JSON.stringify(poppySettings)
  });
  setUIHelpers();
}

async function updateBlacklist(val){
  const host = await getPage();
  const blacklist = poppySettings.blacklist ? poppySettings.blacklist : [];
  const index = blacklist.indexOf(host);

  // handles firefox homepage blank hostname.
  if (!host) return;

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
}

// https://stackoverflow.com/questions/11594576/getting-current-browser-url-in-firefox-addon
async function getPage(){
  const res = await browser.tabs.query({currentWindow: true, active: true});
  const url = new URL(res[0].url);
  return url.hostname;
}