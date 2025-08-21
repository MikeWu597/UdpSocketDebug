const { ipcMain } = require('electron');
const dgram = require('dgram');
const server = dgram.createSocket('udp4');


function passMainWindow(win) {
    this.win = win;
}

server.on('error', (err) => {
    console.error(`UDP Server error: ${err}`);
    server.close();
});

server.on('message', (msg, rinfo) => {
    // 处理中文
    var msgDecoded = msg.toString('utf8');
    console.log(`Received message: ${msgDecoded} from ${rinfo.address}:${rinfo.port}`);
    const from = { address: rinfo.address, port: rinfo.port };
        if (win && !win.isDestroyed()) {
            win.webContents.send('udp-message-received', {
                message: msgDecoded,
                from: from
            });
        }
});


const startUdpServer = () => {


    ipcMain.on('start-udp-server', (event, port) => {
        server.bind(port, () => {
            console.log(`UDP Server bound to port ${port}`);
        });
    });

    ipcMain.on('send-udp-message', (event, { ip, port, message }) => {
        const buffer = Buffer.from(message, 'utf8');
        server.send(buffer, 0, buffer.length, port, ip, (err) => {
            if (err) {
                console.error(`发送消息到 ${ip}:${port} 失败: ${err}`);
            } else {
                console.log(`消息已发送到 ${ip}:${port}`);
            }
        });
    });

};

module.exports = { startUdpServer, passMainWindow };