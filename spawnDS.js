const {spawn} = require("child_process")

module.exports = function(opts) {
  opts = opts || {}
  const log = opts.log || ( ()=>{} )
  const cwd = opts.cwd || '/opt/ti/uniflash/deskdb/content/TICloudAgent/linux/ccs_base/DebugServer/bin'
  const execFile = "./DSLite"

  return function spawnDS(args) {
    return new Promise( (resolve, reject)=>{
      const ds = spawn(execFile, args, {cwd})
      if (opts.log) {
        ds.stdout.on('data', s=>log(`dslite stdout: ${s}`))
        ds.stderr.on('data', s=>log(`dslite stderr: ${s}`))
      }
      ds.on("close", code => {
        if (code == 0) return resolve()
        reject(new Error(`dslite exit code: ${code}`))
      })
      ds.on("error", reject)
    })
  }
}
