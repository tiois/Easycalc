const { app, BrowserWindow, Menu, protocol, ipcMain, globalShortcut, dialog } = require( 'electron' );
const log                                                                     = require( 'electron-log' );
const { autoUpdater }                                                         = require( "electron-updater" );

//-------------------------------------------------------------------
// Logging
//
// THIS SECTION IS NOT REQUIRED
//
// This logging setup is not required for auto-updates to work,
// but it sure makes debugging easier :)
//-------------------------------------------------------------------
autoUpdater.logger                       = log;
autoUpdater.logger.transports.file.level = 'info';
log.info( 'App starting...' );
//-------------------------------------------------------------------
// Define the menu
//
// THIS SECTION IS NOT REQUIRED
//-------------------------------------------------------------------
let template = []
if ( process.platform === 'darwin' ) {
    // OS X
    const name = app.getName();
    template.unshift( {
        label:   name,
        submenu: [
            {
                label: 'About ' + name,
                role:  'about'
            },
            {
                label:       'Quit',
                accelerator: 'Command+Q',
                click() {
                    app.quit();
                }
            },
        ]
    } )
}

//-------------------------------------------------------------------
// Open a window that displays the version
//
// THIS SECTION IS NOT REQUIRED
//
// This isn't required for auto-updates to work, but it's easier
// for the app to show a window than to have to click "About" to see
// that updates are working.
//-------------------------------------------------------------------
let win;
let consoleVisible = false;

function sendStatusToWindow( text ) {
    log.info( text );
    win.webContents.send( 'message', text );
}

function createDefaultWindow() {
    win = new BrowserWindow( {
        webPreferences: {
            allowRunningInsecureContent: true,
            webSecurity:                 false,
            nodeIntegration:             true
        }
    } );
    
    /**
     * Permettre l'ouverture et fermeture de la console
     */
    globalShortcut.register( 'CommandOrControl+F12', () => {
        if ( consoleVisible ) {
            win.webContents.closeDevTools();
            consoleVisible = !consoleVisible;
        } else {
            win.webContents.openDevTools();
            consoleVisible = !consoleVisible;
        }
    } );
    
    win.on( 'closed', () => {
        win = null;
    } );
    
    win.loadFile( 'Easycalc.html' )
    return win;
}

autoUpdater.on( 'checking-for-update', () => {
    sendStatusToWindow( 'Checking for update...' );
} );
autoUpdater.on( 'update-available', ( info ) => {
    win.webContents.send( 'update_available' );
    sendStatusToWindow( 'Update available.' );
} );
autoUpdater.on( 'update-not-available', ( info ) => {
    sendStatusToWindow( 'Update not available.' );
} );
autoUpdater.on( 'error', ( err ) => {
    sendStatusToWindow( 'Error in auto-updater. ' + err );
} );
autoUpdater.on( 'download-progress', ( progressObj ) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message     = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message     = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    sendStatusToWindow( log_message );
} );
autoUpdater.on( 'update-downloaded', ( info ) => {
    win.webContents.send( 'update_downloaded' );
    sendStatusToWindow( 'Update downloaded' );
} );
app.on( 'ready', function () {
    // Create the Menu
    const menu = Menu.buildFromTemplate( template );
    Menu.setApplicationMenu( menu );
    createDefaultWindow();
} );
app.on( 'window-all-closed', () => {
    app.quit();
} );

//
// CHOOSE one of the following options for Auto updates
//

//-------------------------------------------------------------------
// Auto updates - Option 1 - Simplest version
//
// This will immediately download an update, then install when the
// app quits.
//-------------------------------------------------------------------
app.on( 'ready', function () {
    autoUpdater.checkForUpdatesAndNotify();
    sendStatusToWindow( 'ready' );
} );

ipcMain.on( 'app_version', ( event ) => {
    event.sender.send( 'app_version', { version: app.getVersion() } );
} );

ipcMain.on( 'restart_app', () => {
    autoUpdater.quitAndInstall();
} );
