module.exports = function(opts){
  return function(_attachedProbes, id) {
    // Assume it's xds100v2
    return Promise.resolve({ connectionXml: "TIXDS100v2_Connection", id })
  }
}
