const info = require('/opt/ti/uniflash/TICloudAgentHostApp/src/targetDetection/board_ids.json')
const retry = require('dont-stop-believing')

module.exports = function(log) {

  const getDescriptor = retry(function(device, cb) {
    device.open()
    device.getStringDescriptor(3, (err, buf) => {
      device.close()
      if (err) return cb(err)
      cb(null, buf.toString())
    })
  })

  return {
    detectDevice,
    getDescriptor
  }

  function detectDevice(device) {
    return new Promise( (resolve, reject)=>{
      getDescriptor(device, (err, desc)=>{
        if (err) return reject(err)
        const info = getInfo(desc)
        if (!info) return reject('No board info found for ' + desc)
        resolve(info)
      })
    })
  }

  function getInfo(desc) {
    const key = desc.slice(0, 4)
    return info[key] || {}
  }
}

