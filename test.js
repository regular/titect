const detect = require('.')

const log = ()=>{}
const {getDeviceList, detectDebugProbes, detectDevice, identifyProbe} = detect({log})

async function main() {
  //console.log(await getDeviceList())
  const list = await detectDebugProbes()
  for(const e of list.probes) {
    const device = await detectDevice(e.id)
    //console.log(device)
    identifyProbe(e.id)
    
    const { serialNumber, comPorts, connectionXml} = e

    const ret = Object.assign({
      serialNumber,
      comPorts,
      connectionXml
    }, device)
    console.log(ret)
  }
}

main()

