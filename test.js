const detect = require('.')

const log = ()=>{}
const {getDeviceList, detectDebugProbes, detectDevice, identifyProbe} = detect({log})

async function main() {
  //console.log(await getDeviceList())
  const list = await detectDebugProbes()
  for(const e of list.probes) {
    console.log(e)
    const device = await detectDevice(e.id)
    console.log(device)
    identifyProbe(e.id)
  }
}

main()

