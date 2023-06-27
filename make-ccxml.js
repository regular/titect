
module.exports = function({deviceXml, connectionXml, serialNumber}) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<configurations id="configurations_0">
  <configuration id="configuration_0">
    <instance desc="${serialNumber}" href="connections/${connectionXml}.xml" id="${connectionXml.toUpperCase()}" xml="${connectionXml}.xml" xmlpath="connections"/>
    <connection id="${connectionXml.toUpperCase()}">

      <instance href="drivers/tixds510icepick_c.xml" id="drivers" xml="tixds510icepick_c.xml" xmlpath="drivers"/>
      <instance href="drivers/tixds510cs_dap.xml" id="drivers" xml="tixds510cs_dap.xml" xmlpath="drivers"/>
      <instance href="drivers/tixds510cortexM.xml" id="drivers" xml="tixds510cortexM.xml" xmlpath="drivers"/>
      <property Type="choicelist" Value="1" id="Power Selection">
        <choice Name="Probe supplied power" value="1">
          <property Type="stringfield" Value="3.3" id="Voltage Level"/>
        </choice>
      </property>
      <property Type="choicelist" Value="0" id="JTAG Signal Isolation"/>
      <property Type="choicelist" Value="4" id="SWD Mode Settings">
        <choice Name="cJTAG (1149.7) 2-pin advanced modes" value="enable">
          <property Type="choicelist" Value="1" id="XDS110 Aux Port"/>
        </choice>
      </property>
      <property Type="choicelist" Value="1" id="Debug Probe Selection">
        <choice Name="Select by serial number" value="0">
          <property Type="stringfield" Value="${serialNumber}" id="-- Enter the serial number"/>
        </choice>
      </property>
      <platform id="platform_0">
        <instance desc="${deviceXml.toUpperCase()}" href="devices/${deviceXml}.xml" id="${deviceXml.toUpperCase()}" xml="${deviceXml}.xml" xmlpath="devices"/>
      </platform>
    </connection>
  </configuration>
</configurations>
`
}
