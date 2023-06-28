#!/usr/bin/env node
const fs = require('fs')
const conf = require('rc')('titect')
const Detect = require('.')
const makeCCXML = require('./make-ccxml')
const {missingFiles} = require('./target-db')
const Blink = require('./blink')

let log = ()=>{}
if (conf.verbose) {
  log = console.log
}
const {getUSBDeviceList, detectDebugProbe, detectDevice} = Detect({log})
const blink = Blink({log})

async function detect() {
  const probes = await Promise.all(
    getUSBDeviceList().map(usbdevice=>{
      return detectDebugProbe(usbdevice).then(o=>{
        return Object.assign(o, {usbdevice})
      })
    })
  )
  return Promise.all(probes.map( async probe => {
    const device = await detectDevice(probe.usbdevice)
    
    const { serialNumber, comPorts, connectionXml} = probe

    if (!device.deviceXml) {
      console.error(`WARN: Failed to detect MCU of ${serialNumber}, using default.`)
      device.deviceXml = 'cc2640r2f'
    }

    return Object.assign({
      serialNumber,
      comPorts,
      connectionXml
    }, device)
    
  }))
}

async function main() {
  try {
    const list = await detect()
    if (conf.json) {
      console.log(JSON.stringify(list, null, 2))
    } else {
      list.sort(sortf).forEach( ({connectionXml, deviceXml, serialNumber, comPorts})=>{
        console.log(`#${serialNumber} (${(deviceXml || '???').toUpperCase()}) via ${connectionXml} on ${(comPorts || []).join(' ')}`)
      })
    }
    if (conf.blink) {
      list.forEach(blink)
    }
    if (conf.ccxml) {
      list.forEach(async e=>{
        const filename = `${e.serialNumber}-${e.deviceXml.toUpperCase()}.ccxml`
        console.error(`Making ${filename} ...`)
        fs.writeFileSync(filename, makeCCXML(e), 'utf8')
        const missing = await missingFiles(filename)
        if (missing.length) {
          console.error(`WARN: There are files referenced in ${filename} that are not found in targetDB:`)
          missing.forEach(m=>console.error('  -', m))
        }
      })
    }
  } catch(err) {
    console.error(err.stack)
    process.exit(1)
  }
}

main()

// -- util
function sortf(a, b) {
  const cp = x=>((x.comPorts || [])[0] || '')
  if (cp(a) > cp(b)) return 1
  return -1
}
