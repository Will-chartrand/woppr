let browseBtn;
let pathInput;
let saveBtn;
let notInstalledBtn;
let statusText;

const wireUpButtons = () => {
  notInstalledBtn.addEventListener('click', async () => {
  });

  browseBtn.addEventListener('click', async () => {
    // TODO: make the install tutorial
    window.api.send('install-tutorial', path);
  });

  saveBtn.addEventListener('click', () => {
    const path = pathInput.value;
    if (!path) {
      statusText.textContent = 'Please select a folder first!';
      return;
    }
    window.api.send('save-xlivebg-path', path);
    window.api.setupDone();
    statusText.textContent = 'Path saved successfully!';
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log("its loaded");
  browseBtn = document.getElementById('browse-btn');
  pathInput = document.getElementById('xlivebg-path');
  saveBtn = document.getElementById('save-btn');
  statusText = document.getElementById('status');

  wireUpButtons();
});

