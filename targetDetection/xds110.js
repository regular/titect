const BoardId = require("./board_id");
const SerialId = require("./serial_id")

module.exports = function(opts) {
  opts = opts || {}
  const log = opts.log || ( ()=>{} )
  const {readBoardId} = BoardId(log)
  const {findComPorts} = SerialId(opts)

  return function detectDebugProbe(attachedProbes, id) {
    log('xds110: detectDebugProbe')
    const device = attachedProbes[id]
    // We know we're an xds110
    // Read the board id, and then fill in that value for the serial number
    return readBoardId(device.usbDevice).then(serialNumber => {
      log('serial number:', serialNumber)
      return findComPorts(serialNumber).then(comPorts=> {
        const ret = {
          connectionXml: "TIXDS110_Connection",
          id,
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
