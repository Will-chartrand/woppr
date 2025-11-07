const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fss = require('fs');

const execSync = require('child_process').execSync;
const { spawn } = require('child_process');

let mainWindow;
let setupWindow;
let xlivebg_path = "";
let xlivebg_conf_path = "";
let plugin_path_list = [];
let plugins = [];
let settings = {};

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('src/index.html');
}

function createSetupWindow() {
  setupWindow = new BrowserWindow({
    autoHideMenuBar: true,
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  setupWindow.loadFile('src/setup.html');
}

// If conf doesn't exist, create it along with the directory in XDG_CONFIG_HOME
async function checkIfConfigExists(){
  if(process.env.XDG_CONFIG_HOME){
    xlivebg_conf_path = path.join(process.env.XDG_CONFIG_HOME, 'xlivebg');
    console.log("WE HAVE XDG CONFIG HOME");
  } else if(process.env.HOME){
    xlivebg_conf_path = path.join(process.env.XDG_CONFIG_HOME, '.config/xlivebg');
    console.log("WE HAVE JUST HOME");
  } else {
    console.log("please set your HOME environment variable, idiot. Or even better set your XDG_CONFIG_HOME");
    return;
  }

  if(fss.existsSync(xlivebg_conf_path)){
  console.log("trying read file");
    try {
      const settingsJSON = await fs.readFile(path.join(xlivebg_conf_path, 'config.json'), 'utf8');
      console.log(settingsJSON);

      settings = JSON.parse(settingsJSON);
    } catch (err) {
      console.log(err);
    }
  } else { // config directory doesn't exist in .config
    fs.mkdir(xlivebg_conf_path);
    fs.writeFile(path.join(xlivebg_conf_path, 'config.json'), '', { encoding: 'utf-8' });

  }
}

app.whenReady().then(async () => {
  // TODO: conditional for if the user has already set up the xlivebg path


  await checkIfConfigExists();

  if(settings.xlivebg_path){
    xlivebg_path = settings.xlivebg_path;
    createMainWindow();
  } else {
    createSetupWindow();
  }
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  try {
    execSync("pkill xlivebg");
    console.log("Killed existing xlivebg process.");
  } catch {
    console.log("pkill didn't work");
  }

  if (process.platform !== 'darwin') app.quit();
});


// Is called when user has finished with the setup screen
ipcMain.handle('setup-done', function(event, data) {
  console.log("SETUP DONE NOW");
  createMainWindow();
  setupWindow.destroy();
});

ipcMain.handle('get-plugins', async () => {
  console.log('getting plugins');
  plugin_path_list = await getPluginPaths(path.join(xlivebg_path, 'plugins'));
  console.log("got plugins PATHS:");
  console.log(plugin_path_list);
  plugin_obj_list = await getPluginObjects(path.join(xlivebg_path, 'plugins'));

  console.log("got plugin objects:");
  console.log(plugin_obj_list);


  return plugin_obj_list.map((x) => x.name);
});

ipcMain.on('select-plugin', function(event, data) {
  console.log(data);

  let newChoice;

  newChoice = data.data;

  console.log("new choice is " + newChoice);

    try {
      execSync("pkill xlivebg");
      console.log("Killed existing xlivebg process.");
    } catch {
      console.log("pkill didn't work");
    }

  // Create and write new config choice to xlivebg config file
  const configContents = `xlivebg {
      active = "${newChoice}"
  }
  `;
  fs.writeFile(path.join(process.env.XDG_CONFIG_HOME, 'xlivebg.conf'), configContents, { encoding: 'utf-8' });

  spawn(path.join(xlivebg_path, 'xlivebg'), ['-n'], {
    detached: true,
    stdio: 'ignore',
  }).unref();
});


/* 
 * FOR CHOOSING XLIVEBG PATH
 * */

ipcMain.handle('select-xlivebg-path', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  xlivebg_path = result.canceled ? null : result.filePaths[0];
  console.log("folder is now set to");
  console.log(xlivebg_path);
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.on('save-xlivebg-path', (event, xlivebgPath) => {
  // Here you can save it to a config file or app settings
  
  // TODO: check if the file AND PATH exists before writing to it. maybe goober user deleted it mid execution

  console.log("WE HAVE THE CONF DIRECTORY:");
  console.log(xlivebg_conf_path);
  let configPath;

  try {
    configPath = path.join(xlivebg_conf_path, 'config.json');
  } catch (err) {
    console.log(err)
    configPath = "";
  }

  fs.writeFile(configPath, `{
    "xlivebg_path": "${xlivebg_path}"
  }`
  , { encoding: 'utf-8' });

  console.log('XLivebg path saved:', xlivebgPath);
});



/* 
 * HELPERS
 * */

async function getPluginObjects() {
  let results = [];

  try {
    for(const plugin_path of plugin_path_list) {
      let fullPath = path.join(plugin_path, "plugin.json");

      const data = await fs.readFile(fullPath, 'utf8');
      const json = JSON.parse(data);

      results.push(json);
    }
    return results;
  } catch {
    console.log("couldn't parse plugin json files");
    return [];
  }
}

async function getPluginPaths(dir) {

  console.log("getting plugin directory paths");
  console.log(dir);

  const entries = await fs.readdir(dir, { withFileTypes: true });
  let results = [];

  for (const ent of entries) {
    const fullPath = path.join(dir, ent.name);

    if (ent.isDirectory()) {
      if (ent.name === '.git') continue; // ignore .git
      // const sub = await getPluginPaths(fullPath);
      // results.push(...sub);
      results.push(fullPath);
    } 

    // else if (ent.isFile() && ent.name.endsWith('.so')) {
    //   results.push(fullPath); // full path
    // }
  }

  return results;
}
