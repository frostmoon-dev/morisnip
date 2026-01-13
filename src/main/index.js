import { app, shell, BrowserWindow, ipcMain, desktopCapturer, globalShortcut, screen, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow = null
let tray = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    title: 'Morisnip',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray() {
  const trayIcon = nativeImage.createFromPath(icon)
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Take Screenshot', 
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('TRIGGER_SCREENSHOT')
        }
      }
    },
    { type: 'separator' },
    { 
      label: 'Show Window', 
      click: () => {
        if (mainWindow) {
          mainWindow.show()
        }
      }
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])
  
  tray.setToolTip('Morisnip - Ctrl+Shift+S to capture')
  tray.setContextMenu(contextMenu)
  
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show()
    }
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.morisnip')

  // Enable auto-launch on Windows startup
  if (!is.dev) {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: true // Start minimized to tray
    })
  }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('HIDE_WINDOW', async () => {
    if (mainWindow) {
      mainWindow.hide()
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    return true
  })

  ipcMain.handle('SHOW_WINDOW', async () => {
    if (mainWindow) {
      mainWindow.show()
    }
    return true
  })

  ipcMain.handle('GET_SCREEN_SOURCES', async () => {
    const sources = await desktopCapturer.getSources({ 
      types: ['screen'],
      thumbnailSize: { width: 400, height: 300 }
    })
    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL()
    }))
  })

  ipcMain.handle('GET_DISPLAY_BOUNDS', async () => {
    const primaryDisplay = screen.getPrimaryDisplay()
    return primaryDisplay.bounds
  })

  ipcMain.handle('SAVE_IMAGE', async (_, dataUrl) => {
    const { dialog } = require('electron')
    const fs = require('fs')
    const { filePath } = await dialog.showSaveDialog({
      buttonLabel: 'Save Image',
      defaultPath: `screenshot-${Date.now()}.png`,
      filters: [{ name: 'Images', extensions: ['png'] }]
    })

    if (filePath) {
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
      fs.writeFile(filePath, base64Data, 'base64', (err) => {
        if (err) console.error(err)
      })
      return true
    }
    return false
  })

  // Register global shortcut (Ctrl+Shift+S)
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    if (mainWindow) {
      mainWindow.webContents.send('TRIGGER_SCREENSHOT')
    }
  })

  createWindow()
  createTray()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Don't quit, keep in tray
  }
})
