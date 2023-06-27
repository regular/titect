const usb = require("usb")
const BoardId = require('./board_id')

// This is a map of vid, pid -> connection xml file
const tiDebugProbes = require("./targetDetection/debug_probes.json").reduce((result, entry) => {
  result[entry.vid + "_" + entry.pid] = entry
  return result
}, {})

module.exports = function detector(opts) {
  opts = opts || {}
  const log = opts.log || (()=>{})
  const boardId = BoardId(log)
  const deviceDetectors = {
    board_id: boardId.detectDevice
  }
  const probeDetectors = {
    xds100: require('./xds100')({log}),
    xds110: require('./xds110')({log})
  }

  return {
    getUSBDeviceList,
    detectDebugProbe,
    detectDevice // very simplistic baesd on first 4 digits of serial number
  }

  function detectDebugProbe(probe) {
    const key = getKey(probe)
    log('detecting', key)
    const probeInfo = tiDebugProbes[key]
    log('probeinfo', probeInfo)
    const {connectionXml} = probeInfo
    if (connectionXml) {
      return Promise.resolve({
        connectionXml
      })
    } else {
      return probeDetectors[probeInfo.probeDetection.algorithm](probe)
    }
  }
  function getUSBDeviceList() {
    return usb.getDeviceList().filter(device => {
      const key = getKey(device)
      log("detected usb id " + key)
      return (key in tiDebugProbes)
    })
  }
  
  function detectDevice(probe, options) {
    const {deviceDetection} = tiDebugProbes[getKey(probe)]
    log('deviceDetection alg', deviceDetection)
    if (!deviceDetection) return Promise.resolve({ name: undefined })
    return deviceDetectors[deviceDetection.algorithm](probe, options)
  }
}

// -- util

// Returns a key for a device into the tiDebugProbes map
function getKey(device) {
  const {idVendor, idProduct} = device.deviceDescriptor
  return asHex(idVendor) + "_" + asHex(idProduct)
}

function asHex(id) {
  let result = id.toString(16)
  while (result.length < 4) {
    result = "0" + result
  }
  return result
}
