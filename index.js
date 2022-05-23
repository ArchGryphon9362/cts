const net = require('net')
const HOST = '192.168.68.110'
const PORT = 34567
const PRE_LOGIN_BYTES = [0xff,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0xe8,0x03,0x64,0x00,0x00, 0x00]
const LOGIN_MESSAGE = '{ "EncryptType" : "MD5", "LoginType" : "DVRIP-Web", "PassWord" : "tlJwpbo6", "UserName" : "admin" }.'
const PRE_TIME_BYTES = [0xff,0x00,0x00,0x00,0x09,0x00,0x00,0x00,0x05,0x00,0x00,0x00,0x00,0x00,0xaa,0x05,0x61,0x00,0x00, 0x00]
const TIME_MESSAGE = '{ "Name" : "OPUTCTimeSetting", "OPUTCTimeSetting" : "<TIME>", "SessionID" : "<SID>" }.'

function strToBytes(string) {
    const arr = []
    for (var i = 0; i < string.length; i++) {
        arr[i] = string.charCodeAt(i)
    }
    // console.log(arr)
    return arr
}

function mergeToU8A(a, b) {
    return new Uint8Array([...a, ...b])
}

const LOGIN = mergeToU8A(PRE_LOGIN_BYTES, strToBytes(LOGIN_MESSAGE))

const client = new net.Socket()

client.connect(PORT, HOST, () => {
    console.log('CONNECTED TO: ' + HOST + ':' + PORT)
    client.write(LOGIN)
    // console.log(LOGIN)
})

client.on('data', (data) => {
    let data_s = data.toString()
    data_s = data_s.substring(data_s.indexOf('{'), data_s.lastIndexOf('}') + 1)
    let dataJson = JSON.parse(data_s)

    if (dataJson.SessionID) {
        let date = new Date()
        let dateFormated = `${date.getFullYear()}-${date.getDate().toString().padStart(2, 0)}-${date.getMonth().toString().padStart(2, 0)} ${date.getHours().toString().padStart(2, 0)}:${date.getMinutes().toString().padStart(2, 0)}:${(date.getSeconds() + 1).toString().padStart(2, 0)}`
        let timeMsg = TIME_MESSAGE.replace('<SID>', "0x" + Number(dataJson.SessionID).toString(16)).replace('<TIME>', dateFormated)
        let time = mergeToU8A(PRE_TIME_BYTES, strToBytes(timeMsg))
        client.write(time) ? console.log("Time Set!") : 0
        client.destroy()
    }
})

client.on('close', function() {
    console.log('Connection closed');
});
