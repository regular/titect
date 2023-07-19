//#include <vector>
#include <stdio.h>

#include <xdc/std.h>
#include <xdc/runtime/Diags.h>
#include <xdc/runtime/System.h>

/* BIOS module Headers */
#include <ti/sysbios/BIOS.h>
#include <ti/sysbios/family/arm/m3/Hwi.h>

#include "Board.h"

void getDeviceInfo(char *buff, int buffsize);

int main() {
  char buff[128];
  getDeviceInfo(buff, sizeof(buff));
  System_printf(buff);
  System_flush();

  BIOS_exit(0);
  return 0;
}

