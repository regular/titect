const {spawn} = require("child_process")

module.exports = function(opts) {
  opts = opts || {}
  const log = opts.log || ( ()=>{} )
  const cwd = opts.cwd || '/opt/ti/uniflash/deskdb/content/TICloudAgent/linux/ccs_base/DebugServer/bin'
  const execFile = "./DSLite"

  return function spawnDS(onClose, args) {
    let lp
    let stdouth
    return new Promise( (resolve, reject)=>{
      log("Runnung DSLite");
      log("spawnDS : execFile = " + execFile + " cwd = " + cwd)
      log("args = " + args.toString())
      lp = spawn(execFile, args, { cwd })

      function stdoutHandler(data) {
        const dataStr = data.toString()
        log("DS Lite : " + dataStr)
        if (dataStr.indexOf("Error") > -1) {
          log(dataStr)
          reject(new Error(dataStr))
          return
        }
        try {
          const dataObj = JSON.parse(dataStr);
          if (dataObj.port) {
            log("Started DS Lite : " + dataStr)
            resolve(dataObj)
          }
        } catch (e) { }
      }
      stdouth = stdoutHandler
      lp.stdout.on("data", stdouth)
      lp.stderr.on("data", data => {
        log(data.toString())
        //reject({ message: data.toString() })
      })
      lp.on("close", () => {
        log("DSLite process : close event");
        onClose()
      })
      lp.on("exit", () => {
        log("DSLite process : exit event")
      })
      lp.on("disconnect", () => {
        log("DSLite process : disconnect event")
      })
      lp.on("error", (err) => {
        log("DSLite process : error event" + err.toString())
        reject(err)
      })
    }).finally(() => {
      // Once the promise is complete, stop listending to stdout
      // This saves us from logging 1000's of ctools logging messages
      lp.stdout.removeListener("data", stdouth)
    })
  }
}
