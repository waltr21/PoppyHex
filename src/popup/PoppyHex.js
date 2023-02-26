document.addEventListener("mouseup", selectionCheck);
const colorReg = /^#([0-9a-fA-F]{3}){1,2}$/;
let poppySettings = {};
let hovering = false;
injectHtml();

// No clue if this is the best way to do this!
async function injectHtml(){
  await loadSettings();
  const rootEl = document.documentElement;
  const url = browser.extension.getURL("./src/popup/PoppyHex.html");
  var cssUrl = browser.extension.getURL("./src/popup/PoppyHex.css");

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = cssUrl;

  // Inject the <link> element into the page's <head> section
  document.head.appendChild(link);

  const res = await fetch(url).then(function(response) {
    return response.text();
  });
  const html = res.valueOf();
  
  rootEl.insertAdjacentHTML('beforeend', html);
  setListeners();
}

function selectionCheck(){
  let selection = "";
  let activeEl = document.activeElement;
  let activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;

  // Handles text area: https://stackoverflow.com/questions/5379120/get-the-highlighted-selected-text
  if (
    (activeElTagName == "textarea") || (activeElTagName == "input" &&
    /^(?:text|search|password|tel|url)$/i.test(activeEl.type)) &&
    (typeof activeEl.selectionStart == "number")
  ) {
    selection = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);
  } else if (window.getSelection) {
    selection = window.getSelection().toString();
  }

  checkSelectionForColor(selection.trim());
}

async function checkSelectionForColor(str){
  if (hovering) return; 
  if (await isRestricted(str)) return;
  // Slap a # if missing.
  if (str[0] != '#') str = `#${str}`;
  let res = colorReg.exec(str);
  const el = document.getElementById('poppy-container');
  if (res){
    setHex(str);
    openPopup();
  } else {
    closePopup();
  }
}

function closePopup(){
  if (!hovering){
    const el = document.getElementById('poppy-container');
    el.style.right = '-250px';
  }
}

function openPopup(){
  const el = document.getElementById('poppy-container');
  el.style.right = '20px';
}

function setListeners(){
  const copyHex = document.getElementById('copy-hex');
  const copyNoHex = document.getElementById('copy-no-hex');
  const copyRGB = document.getElementById('copy-rgb');
  copyHex.addEventListener('click', function (event) {
    copyToClip(copyHex.innerText);
  });
  copyNoHex.addEventListener('click', function (event) {
    copyToClip(copyNoHex.innerText);
  });
  copyRGB.addEventListener('click', function (event) {
    copyToClip(copyRGB.innerText);
  });
  
  const poppyContainer = document.getElementById('poppy-container');
  poppyContainer.addEventListener('mouseleave', function (event) {
    setCopyHelper('Click to copy.');
    hovering = false;
  });

  poppyContainer.addEventListener('mouseenter', function (event) {
    hovering = true;
  });
}

function copyToClip(str){
  navigator.clipboard.writeText(str);
  setCopyHelper('Copied!');
}

function setCopyHelper(str){
  const el = document.getElementById('poppy-copy-helper');
  el.innerText = str;
}

function setHex(str){
  const swatch = document.getElementById('poppy-hex-title');
  const swatchTitle = document.getElementById('poppy-color-swatch');
  const copyHex = document.getElementById('copy-hex');
  const copyNoHex = document.getElementById('copy-no-hex');
  const copyRGB = document.getElementById('copy-rgb');
  copyHex.innerText = str;
  copyNoHex.innerText = str.replace('#', '');
  copyRGB.innerText = hexToRgb(str);
  swatchTitle.style.backgroundColor = str;
  
  // Always set title to 6 digits. Logic to include additional hash or not.
  let res = hex3_to_hex6(str);
  if (res.length == 6) res = `#${res}`;
  swatch.innerText = res;
}

// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRgb(hex) {
  hex = hex3_to_hex6(hex);
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return result ? `(${r},${g},${b})` : '(0,0,0)';
}

function hex3_to_hex6(str) {
  const tempStr = str.replace('#', '');
  if (tempStr.length != 3) return str;
  let hex6 = "";
  for (let i = 0; i < tempStr.length; i++) {
    hex6 += tempStr[i] + tempStr[i];
  }
  return hex6;
}

async function loadSettings(){
  const res = await browser.storage.sync.get('poppySettings');
  poppySettings = res.poppySettings;
  poppySettings = poppySettings ? JSON.parse(poppySettings) : {};
  console.log('Loaded settings: ', poppySettings);
}

async function isRestricted(str){
  // Let regex naturally reject.
  if (str.length < 3 || str.length > 7) return false;
  // Refresh settings.
  await loadSettings();

  // disable: t/f
  // includeHash: t/f
  // includeHashThree: t/f
  // sixDigit: t/f

  if (poppySettings.disable) return true;

  if (poppySettings.includeHash){
    if (str[0] != '#') return true;
  }

  if (poppySettings.includeHashThree){
    if (str.length <= 4 && str[0] != '#') return true;
  }

  if (poppySettings.sixDigit){
    if (str.length < 6) return true;
  }

  return false;

}