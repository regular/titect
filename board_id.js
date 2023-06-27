const boardIdInfo = require('/opt/ti/uniflash/TICloudAgentHostApp/src/targetDetection/board_ids.json')

module.exports = function(log) {

  return {
    detectDevice,
    readBoardId
  }

  async function detectDevice (device, _options) {
    const boardId = await readBoardId(device)
    return decodeBoardId(boardId)
  }
  async function readBoardId(device) {
    let error;
    for (let i = 0; i < 20; ++i) {
      try {
        return getStringDescriptor(device)
      }
      catch (err) {
        error = err.message ? err.message : err;
        log("Got exception reading board id: " + error)
      }
      // Most likely windows is still setting up the device drivers.  Wait one second and try again
      log("Waiting 1 second before retrying");
      await delay(1000)
    }
    throw new Error(`Unable to open USB device - ensure drivers are installed (${error})`);
  }

  function getStringDescriptor(device) {
    device.open()
    return new Promise((resolve, reject) => {
      device.getStringDescriptor(3, (err, buf) => {
        device.close()
        if (err) return reject(err)
        resolve(buf.toString())
      })
    })
  }

  function decodeBoardId(boardId) {
    const key = boardId.slice(0, 4)
    const info = boardIdInfo[key]
    return info || {name: undefined}
  }
}

// -- util

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliseconds)
  })
}
