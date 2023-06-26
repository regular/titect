const fs = require("fs");
const path = require("path");
const SpawnDS = require("../spawnDS");
//const installer_1 = require("../installer/installer");

const ccxmlPlaceholderPath = path.join(__dirname, "blinkLEDplaceholder.ccxml");
const ccxmlPath = path.join(__dirname, "blinkLED.ccxml");

module.exports = function(opts) {
  opts = opts || {}
  const log = opts.log || ( ()=>{} )
  const triggerEvent = opts.triggerEvent || ( ()=>{} )
  const {dsliteLogPath, cloudAgentInstallerServerURL} = opts
  const spawnDS = SpawnDS(opts)

  return function identify(probe) {
    return new Promise( (resolve, reject)=>{
      const {serialNumber} = probe
      if (!serialNumber) return reject(new Error("No serial number"))
  
      let ccxml = fs.readFileSync(ccxmlPlaceholderPath, "utf-8")
      ccxml = ccxml.replace("REPLACE_SERIAL_NUMBER", serialNumber)
      fs.writeFileSync(ccxmlPath, ccxml, "utf-8")
      const args = [
        "identifyProbe",
        `--config=${ccxmlPath}`,
        "--conId=0",
      ];
      // Extra logging to file for testing purposes
      if (dsliteLogPath) {
        args.push(`--log=${dsliteLogPath}`);
      }
      if (cloudAgentInstallerServerURL) {
        const realInstaller = new installer_1.Installer(cloudAgentInstallerServerURL, {});
        const progress = new progress_1.ProgressGenerator("Installing xds110 probe identify files...", triggerEvent);
        realInstaller
          .installFilesForCcxml(ccxmlPath)
          .progress((progressData) => progress.generateEvent(progressData))
          .then(() => spawnDS(resolve, args))
          .catch(reject)
      } else {
        spawnDS(resolve, args)
        .catch(reject)
      }
    }).finally(() => {
      if (fs.existsSync(ccxmlPath)) {
        log("NOT Deleting temp ccxml")
        //fs.unlinkSync(ccxmlPath);
      }
    })
  }
}
