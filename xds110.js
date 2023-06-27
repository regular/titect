const BoardId = require("./board_id");
const SerialId = require("./serial_id")

module.exports = function(opts) {
  opts = opts || {}
  const log = opts.log || ( ()=>{} )
  const {readBoardId} = BoardId(log)
  const {findComPorts} = SerialId(opts)

  return function detectDebugProbe(device) {
    log('xds110: detectDebugProbe')

    return readBoardId(device).then(serialNumber => {
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
