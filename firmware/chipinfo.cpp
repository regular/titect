#include <sstream>

#include "Board.h"
#include <ti/devices/DeviceFamily.h>
#include DeviceFamily_constructPath(driverlib/chipinfo.h)

void getDeviceInfo(char *buff, int buffsize) {
  typedef struct {
    const char* name;
    int size;
    int pin_count;
  } ChipSizeInfo_t;

  const ChipSizeInfo_t chip_sizes[] = {
    {"RSM", 40, 10},  // 4x4 mm QFN (RHB) package.
    {"RHB", 50, 15},  // 5x5 mm QFN (RSM) package.
    {"RGZ", 70, 31},  // 7x7 mm QFN (RGZ) package.
  };
  const int num_chip_size_info = sizeof(chip_sizes) / sizeof(chip_sizes[0]);

  const char *chip_type_names[] = {
    "CC1310",
    "CC1350",
    "CC2620",
    "CC2630",
    "CC2640",
    "CC2650",
    "CUSTOM_0",
    "CUSTOM_1",
    "CC2640R2",
    "CC2642",
    "n/a",
    "CC2652",
    "CC1312",
    "CC1352",
    "CC1352P"
  };
  const int num_chip_types = sizeof(chip_type_names) / sizeof(chip_type_names[0]);

  int hwRev = ChipInfo_GetHwRevision();
  
  const ChipType_t ct = ChipInfo_GetChipType();
  const char* ct_name;
  if (ct >= num_chip_types || ct < 0) {
    ct_name = "n/a";
  } else {
    ct_name = chip_type_names[ct];
  }

  int sizeIndex = ChipInfo_GetPackageType();

  std::stringstream ss_size;
  const ChipSizeInfo_t* csi;
  if (sizeIndex >= num_chip_size_info || sizeIndex < 0) {
    ss_size << "n/a";
  } else {
    csi = &chip_sizes[sizeIndex];
    ss_size << csi->name << " " << csi->size / 10 << "." << csi->size % 10 << "mm " << csi->pin_count <<" pins";
  }

  std::stringstream ss;
  ss << ct_name << " rev" << hwRev / 10 << "." <<  hwRev % 10;
  ss << " (" << ss_size.str() << ")\n";
  strncpy(buff, ss.str().c_str(), buffsize-1);
  buff[buffsize-1] = 0; // make suze it is zero-terminated
}

