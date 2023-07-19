const fs = require('fs')
const {writeFile} = require('fs/promises')
const {join} = require('path')
const tmp = require('tmp-promise')
const {mkdirp} = require('mkdirp')
const makeFirmware = require('tiffy')
const {runImage, startDSLite} = require('dslite-run-fw')
const makeCCXML = require('./make-ccxml')

const cache = join(process.env.HOME, '.titect', 'cache')

module.exports = async function queryDevice({serialNumber, connectionXml, deviceXml}) {
  const cachefile = join(cache, serialNumber)
  if (fs.existsSync(cachefile)) {
    return JSON.parse(fs.readFileSync(cachefile))
  }
  if (!deviceXml) {
    console.error('WARN gessing device type')
    deviceXml = 'cc2640r2f'
  }

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
  const j = {
    output,
    deviceXml
  } 
  await mkdirp(cache)
  fs.writeFileSync(cachefile, JSON.stringify(j), 'utf8')
  return j 
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
