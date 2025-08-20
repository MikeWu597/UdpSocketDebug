const { ipcMain } = require('electron');
const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const SQLiteManager = require('./sqLiteManager');
SQLiteManager.initialize();


function passMainWindow(win) {
    this.win = win;
}

server.on('error', (err) => {
    console.error(`UDP Server error: ${err}`);
    server.close();
});

server.on('message', (msg, rinfo) => {
    console.log(`Received message: ${msg} from ${rinfo.address}:${rinfo.port}`);
    SQLiteManager.addMessage(rinfo.address, rinfo.port, msg.toString(), (err) => {
        if (err) {
            console.error(`Error adding message to database: ${err}`);
        }
        const from = { address: rinfo.address, port: rinfo.port };
        // ipcMain.emit('udp-message-received', null, { message: msg.toString(), from: from });
        if (win && !win.isDestroyed()) {
            win.webContents.send('udp-message-received', {
                message: msg.toString(),
                from: from
            });
        }
    });
});


const startUdpServer = () => {


    ipcMain.on('start-udp-server', (event, port) => {
        server.bind(port, () => {
            console.log(`UDP Server bound to port ${port}`);
        });
    });


};

module.exports = { startUdpServer, passMainWindow };