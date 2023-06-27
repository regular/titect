const fs = require('fs')
const {join} = require('path')
const flow = require('xml-flow')

const targetDB = '/opt/ti/uniflash/deskdb/content/TICloudAgent/linux/ccs_base/common/targetdb'

module.exports = {
  missingFiles,
  getInstanceHRefs
}

function missingFiles(ccxmlPath) {
  return getInstanceHRefs(ccxmlPath).then(refs=>{
    return refs.filter(f=>!fs.existsSync(join(targetDB, f)))
  })
}

function getInstanceHRefs(ccxmlPath) {
  return new Promise( (resolve, reject)=>{
    const refs = []
    const xml = flow(fs.createReadStream(ccxmlPath))
    xml.on('tag:instance', ({href})=>refs.push(href))    
    xml.on('end', ()=>resolve(refs))
    xml.on('error', reject)
  })
}
