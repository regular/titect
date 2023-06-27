const usb = require("usb")
//const installer_1 = require("../installer/installer");

// This is a map of vid, pid -> connection xml file
const tiDebugProbes = require("./targetDetection/debug_probes.json").reduce((result, entry) => {
  result[entry.vid + "_" + entry.pid] = entry;
  return result
}, {})

module.exports = function detector(opts) {
  opts = opts || {}
  const log = opts.log || (()=>{})
  const deviceDetectionAlgorithms = Object.fromEntries(
    // removed msp430_id
    ['board_id'].map(v=>[v, require(`./targetDetection/${v}`)(log).detectDevice])
  )
  const probeDetectionAlgorithms = Object.fromEntries(
    // removed msp_fet
    'xds100 xds110'.split(' ').map(v=>[v, require(`./targetDetection/${v}`)(opts)])
  )

  let attachedProbes = getDeviceList()

  /*
  usb.addEventListener('attach', device => {
    const key = getKey(device)
    if (key in tiDebugProbes) {
      log("detected attach of usb id " + key)
      attachedProbes = getDeviceList()
    }
  })

  usb.addEventListener('detach', device => {
    const key = getKey(device)
    if (key in tiDebugProbes) {
      log("detected detach of usb id " + key)
      attachedProbes = getDeviceList()
    }
  })
  */

  return {
    getDeviceList,
    detectDebugProbes,
    detectDevice // very simplistic baes on first 4 digits of serial number
  }

  function detectDebugProbe(probeId) {
    const device = attachedProbes[probeId]
    const key = getKey(device.usbDevice)
    log('detecting', key)
    const probeInfo = tiDebugProbes[key]
    log('probeinfo', probeInfo)
    if (probeInfo.connectionXml) {
      return Promise.resolve({
        connectionXml: probeInfo.connectionXml,
        probeId
      })
    } else {
      /*
      return downloadCategories(probeInfo.probeDetection)
        .then(() => probeDetectionAlgorithms[probeInfo.probeDetection.algorithm](attachedProbes, probeId))
      */
      return probeDetectionAlgorithms[probeInfo.probeDetection.algorithm](attachedProbes, probeId)
    }
  }
  function getDeviceList() {
    return usb.getDeviceList().filter(device => {
      const key = getKey(device)
      log("detected usb id " + key)
      return (key in tiDebugProbes)
    }).map(usbDevice =>({usbDevice}))
  }
  
  function detectDebugProbes() {
    const ids = Object.keys(attachedProbes)
    const promises = ids.map(detectDebugProbe)
    return Promise.all(promises)
      .then( probes => { 
        return { probes }
      })
  }
  function detectDevice(probeId, options) {
    const device = attachedProbes[probeId]
    if (!device) {
      throw new Error("Unknown debug probe id: " + probeId)
    }
    const {deviceDetection} = tiDebugProbes[getKey(device.usbDevice)]
    log('deviceDetection alg', deviceDetection)
    if (!deviceDetection) return Promise.resolve({ name: undefined })
    /*
    return this._downloadCategories(deviceDetection)
      .then(() => this.deviceDetectionAlgorithms[deviceDetection.algorithm](device, options));
    */
    return deviceDetectionAlgorithms[deviceDetection.algorithm](device, options)
  }

  function detectDeviceWithProbe(probe) {
    if (!probe.id) return Promise.resolve({ name: undefined })
    return detectDevice(probe.id)
  }
  function filesNeeded() {
    const categories = [] // getCategoriesOfAttachedDevices()
    if (!categories.length) return Promise.resolve(false)
    //const installer = new installer_1.Installer(config.cloudAgentInstallerServerURL, {});
    //return installer.areFilesMissing(categories);
  }
  
  // Fetch the categories necessary to use any of the attached devices
  function getCategoriesOfAttachedDevices() {
    const ids = Object.keys(attachedProbes)
    return ids.reduce((categories, id) => {
      const key = getKey(attachedProbes[id].usbDevice)
      const info = tiDebugProbes[key]
      if (info.deviceDetection) {
        categories = categories.concat(info.deviceDetection.categories)
      }
      if (info.probeDetection) {
        categories = categories.concat(info.probeDetection.categories)
      }
      return categories
    }, [])
  }

  // This downloads the categories specified to detect something
  function downloadCategories(strategy) {
    const undownloaded = strategy.categories
      .filter((category) => !(category in downloads.categories))
    if (undownloaded.length && !config.desktopMode) {
      undownloaded.forEach((category) => downloads.categories[category] = true)
      downloads.promise = downloads.promise.then(() => {
        //const progress = new progress_1.ProgressGenerator("Installing device detection files...", this._triggerEvent);
        //const installer = new installer_1.Installer(config.cloudAgentInstallerServerURL, {});
        return installer.installFilesForCategories(strategy.categories)
          .progress((progressData) => {
            progress.generateEvent(progressData);
          });
      });
    }
    return downloads.promise;
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
