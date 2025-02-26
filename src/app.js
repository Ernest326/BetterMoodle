const { app, BrowserWindow, session } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;
let moodleLink = 'https://moodle.maynoothuniversity.ie/';

function createWindow() {

    //Create a session object
    const ses = session.fromPartition('persist:bettermoodle');

    //Create the window object
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        session: ses
      },
    });
  
    //Grab the cookies
    ses.cookies.get({ url: moodleLink }).then((cookies) => {

      //Filter out the cookies that are no longer valid
      const validCookies = cookies.filter((cookie) => {
        return cookie.expirationDate > Date.now() / 1000;
      });

      //Load website
      if (validCookies.length > 0) {
        console.log('Found valid cookies!');
        mainWindow.loadURL(moodleLink);
      } else {
        console.log('No valid cookies found, going to login');
        mainWindow.loadURL(moodleLink + 'login/index.php');
      }
    }).catch((err) => {
      console.log('Error getting cookies:', err);
      mainWindow.loadURL(moodleLink + 'login/index.php');
    })
  
    //Wait till we load into the main page!
    mainWindow.on('did-navigate', (event, url) => {
      if (url.includes(moodleLink+'/my/')) {
        console.log('Successfully logged in!');

        ses.cookies.flushStore().then(() => {
          console.log('Cookies saved!');
        });

        mainWindow.webContents.on('did-finish-load', () => {
          console.log('Injecting CSS');
          const cssPath = path.join(__dirname, 'styles.css');
          const css = fs.readFileSync(cssPath, 'utf8');
          mainWindow.webContents.insertCSS(css);
        });
      }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}


//Create the window when the app is ready
app.on('ready', createWindow);
  

//Handle closing the window
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
  
app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
});
