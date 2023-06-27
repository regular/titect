const fs = require('fs')
const {spawn} = require("child_process")
const tmp = require('tmp-promise')
const makeCCXML = require('./make-ccxml')

module.exports = function(opts) {
  opts = opts || {}
  const log = opts.log || ( ()=>{} )
  const cwd = opts.cwd || '/opt/ti/uniflash/deskdb/content/TICloudAgent/linux/ccs_base/DebugServer/bin'
  const execFile = "./DSLite"

  return function blinkLEDs(probe) {
    const {serialNumber} = probe
    if (!serialNumber) return Promise.reject(new Error("No serial number"))
    return tmp.withFile(file => {
      return new Promise( (resolve, reject)=>{
        fs.writeFile(file.fd, makeCCXML(probe), 'utf8', err=>{
          if (err) return reject(err)
          resolve()
        })
      }).then( ()=>{
        const args = [
          "identifyProbe",
          `--config=${file.path}`,
          "--conId=0",
        ]
        // Extra logging to file for testing purposes
        args.push(`--log=/dev/stderr`)
        return spawnDS(args)
      })
    })
  }

  function spawnDS(args) {
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
