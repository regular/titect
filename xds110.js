const BoardId = require("./board_id");
const Com = require("./com")

module.exports = function(opts) {
  opts = opts || {}
  const log = opts.log || ( ()=>{} )
  const {getDescriptor} = BoardId(log)
  const {findComPorts} = Com(opts)

  return function detectDebugProbe(device) {
    log('xds110: detectDebugProbe')

    return new Promise( (resolve, reject)=>{
      getDescriptor(device, (err, result)=>{
        if (err) return reject(err)
        resolve(result)
      })
    }).then(serialNumber => {
      log('serial number:', serialNumber)
      return findComPorts(serialNumber).then(comPorts=> {
        const ret = {
          connectionXml: "TIXDS110_Connection",
          serialNumber,
          comPorts,
          overrides: {
            "Debug Probe Selection": "1",
            "-- Enter the serial number": serialNumber,
          }
        }
        return ret
      })
    })
  }
}
