const { ipcMain } = require('electron');
const dgram = require('dgram');
const server = dgram.createSocket('udp4');
server.on('error', (err) => {
    console.error(`UDP Server error: ${err}`);
    server.close();
});

server.on('message', (msg, rinfo) => {
    console.log(`Received message: ${msg} from ${rinfo.address}:${rinfo.port}`);
});


const startUdpServer = () => {
    ipcMain.on('start-udp-server', (event, port) => {
        server.bind(port, () => {
            console.log(`UDP Server bound to port ${port}`);
        });
    });
};

module.exports = { startUdpServer };