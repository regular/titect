const fs = require('fs')
const {writeFile} = require('fs/promises')
const {join} = require('path')
const tmp = require('tmp-promise')
const makeFirmware = require('tiffy')
const {runImage, startDSLite} = require('dslite-run-fw')
const makeCCXML = require('./make-ccxml')

module.exports = async function queryDevice({serialNumber, connectionXml, deviceXml}) {
  if (!deviceXml) deviceXml = 'cc2640r2f' 

  const firmware = await makeFirmware('titect_fw', [
    join(__dirname, 'firmware', 'main.cpp'),
    join(__dirname, 'firmware', 'chipinfo.cpp')
  ])
  const ccxml = makeCCXML({serialNumber, connectionXml, deviceXml})
  const {path} = firmware
  const output = await tmp.withFile(async file => {
    await writeFile(file.path, ccxml, 'utf8')
    const output = await run(file.path, firmware.path)
    return output
  })
  return {output}
}

async function run(ccxml, firmware) {
  const port = 57777
  const proxy = await startDSLite({
    dslite: '/opt/ti/uniflash/deskdb/content/TICloudAgent/linux/ccs_base/DebugServer/bin/DSLite',
    port
  }, {log: null})
  try {
    const output = await runImage(ccxml, firmware, proxy.port, {
      log: null,
      numLines: 1,
      input: 'A'
    })
    console.log('output', output)
    return output
  }  finally {
    proxy.stop()
  }
}
