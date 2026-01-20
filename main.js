const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let serverProc

function startServer() {
  const serverPath = path.join(__dirname, 'server')
  serverProc = spawn('npm', ['run', 'start'], {
    cwd: serverPath,
    shell: true,
    env: { ...process.env, PORT: '5000' }
  })

  serverProc.stdout.on('data', (data) => {
    console.log(`[server] ${data.toString().trim()}`)
  })

  serverProc.stderr.on('data', (data) => {
    console.error(`[server] ${data.toString().trim()}`)
  })
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })
  win.loadURL('http://localhost:5000')
}

app.whenReady().then(() => {
  startServer()
  setTimeout(createWindow, 1500)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (serverProc) {
    serverProc.kill()
  }
})
