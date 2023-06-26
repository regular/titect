const Detect = require('.')

const log = ()=>{}
const {getDeviceList, detectDebugProbes, detectDevice, identifyProbe} = Detect({log})

async function detect() {
  //console.log(await getDeviceList())
  const {probes} = await detectDebugProbes()
  return Promise.all(probes.map( async e => {
    const device = await detectDevice(e.id)
    //identifyProbe(e.id)
    
    const { serialNumber, comPorts, connectionXml} = e

    return Object.assign({
      serialNumber,
      comPorts,
      connectionXml
    }, device)
    
  }))
}

async function main() {
  const list = await detect()
  list.forEach( ({connectionXml, deviceXml, serialNumber, comPorts})=>{
    console.log(`${deviceXml} on ${connectionXml} #${serialNumber} ${(comPorts || []).join(' ')}`)
  })
}

main()

