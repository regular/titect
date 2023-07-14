//#include <vector>
#include <stdio.h>

#include <xdc/std.h>
#include <xdc/runtime/Diags.h>
#include <xdc/runtime/System.h>

/* BIOS module Headers */
#include <ti/sysbios/BIOS.h>
#include <ti/sysbios/knl/Semaphore.h>
#include <ti/sysbios/knl/Task.h>
#include <ti/sysbios/knl/Clock.h>
#include <ti/sysbios/family/arm/m3/Hwi.h>

#include "Board.h"

bool terminated = false;
extern "C" void myExceptionHook(Hwi_ExcContext* ctx) {
  System_printf("\nEXCEPTION\x04");
  System_flush();
  terminated = true;
}

extern "C" void myAbortSystem() {
  if (terminated) return System_abortStd();
  terminated = true;
  System_printf("\nABORT\x04");
  System_flush();
  System_abortStd();
}

extern "C" void myExitSystem(int code) {
  if (terminated) return System_exitStd(code);
  terminated = true;
  System_printf("\nEXIT %d\x04", code);
  System_flush();
  System_exitStd(code);
}
#define TASKSTACKSIZE   512
//const stack_size = 512;

class Clock {
public:
  Clock(int newId);  // Constructor
  void tick();
  int getId() {return id;}
  void setMicrosecond();
  void setMillisecond();
  void setMillisecond(int nMilliseconds);
  void setSecond();
  void setMinute();
  void setHour();
private:
  int id;
  int ticks;
  int microsecond;
  int millisecond;
  int second;
  int minute;
  int hour;
  Diags_Mask clockLog;
};

/*
 * Extern "C" block to prevent name mangling
 * of functions called within the Configuration
 * Tool
 */
extern "C" {
  void clockTerminate(UArg arg);

  /* Wrapper functions to call Clock::tick() */
  void clockTask(UArg arg);
  void clockPrd(UArg arg);
  void clockIdle(void);
}

/* Global clock objects */
Clock cl0(0);  /* idle loop clock */
Clock cl1(1);  /* periodic clock, period = 100 ms */
Clock cl2(2);  /* periodic clock, period = 1 sec */
Clock cl3(3);  /* task clock */
Clock cl4(4);  /* task clock */

Task_Struct task0Struct, task1Struct;
Char task0Stack[TASKSTACKSIZE], task1Stack[TASKSTACKSIZE];


class Sem {
public:
  Sem();
  inline void pend() const {
    Semaphore_pend(_handle, BIOS_WAIT_FOREVER);
  }
  inline void post() const {
    Semaphore_post(_handle);
  }
private:
  Semaphore_Struct _sem;
  Semaphore_Handle _handle;
};

Sem::Sem() {
  Semaphore_Params params;
  Semaphore_Params_init(&params);
  Semaphore_construct(&_sem, 1, &params);
  _handle = Semaphore_Handle(&_sem);
};

class Guard {
public:
  Guard(const Sem& sem) : _sem(sem) {
    _sem.pend();
  }
  ~Guard() {
    _sem.post();
  }
private:
  const Sem& _sem;
};

class Clk {
public:
  Clk(int period, Clock_FuncPtr f, void* arg) {
    Clock_Params params;
    Clock_Params_init(&params);
    params.period = period;
    params.startFlag = true;
    params.arg = (UArg)arg;
    Clock_construct(&_clk, f, 1, &params);
  }
private:
  Clock_Struct _clk;
};

void getDeviceInfo(char *buff, int buffsize);

Sem sem0;
Sem sem1;

Clk myClock1(100, (Clock_FuncPtr)&clockPrd, &cl1);
Clk myClock2(1000, (Clock_FuncPtr)&clockPrd, &cl2);

int main() {
  char input = getchar();
  System_printf("got input: %c\n", input);

//std::vector<uint8_t> stack0(stack_size);
//std::vector<uint8_t> stack1(stack_size);
  Task_Params taskParams;
  Task_Params_init(&taskParams);
  taskParams.arg0 = (UArg)&cl3;
  taskParams.stackSize = TASKSTACKSIZE;
  taskParams.stack = &task0Stack;
  Task_construct(&task0Struct, (Task_FuncPtr)clockTask, &taskParams, NULL);

  taskParams.stack = &task1Stack;
  taskParams.arg0 = (UArg)&cl4;
  Task_construct(&task1Struct, (Task_FuncPtr)clockTask, &taskParams, NULL);

  System_printf("bigTime started.\n");
  char buff[128];
  getDeviceInfo(buff, sizeof(buff));

  System_printf(buff);
  System_flush();

  BIOS_start();    /* does not return */
  return 0;
}

void clockTerminate(UArg arg) {
  System_printf("bigTime ended.\n");
  BIOS_exit(0);
}

/*
 *  ======== clockTask ========
 *  Wrapper function for Task objects calling
 *  Clock::tick()
 */
void clockTask(UArg arg) {
  Clock *clock = (Clock *)arg;
  int count = 0;

  if (clock->getId() == 3) {
    for(;;) {             // task id = 3
      Guard guard(sem0);
      clock->tick();
      if(count == 50) {
        Task_sleep(25);
        count = 0;
      }
      count++;
    }
  } else {
    for(;;) {             // task id = 4
      Guard guard(sem1);
      if(count == 50) {
        Task_sleep(25);
        count = 0;
      }
      clock->tick();
      count++;
    }
  }
}

void clockPrd(UArg arg) {
  Clock *clock = (Clock *)arg;
  clock->tick();
}

/*
 * ======== clockIdle ========
 * Wrapper function for IDL objects calling
 * Clock::tick()
 * It also calls System_flush() to periodically
 * print the contents in the SysMin buffer
 */
void clockIdle(void) {
  cl0.tick();
  System_flush();
}

/*
 * Clock methods
 */
Clock::Clock(int newId) {
  id = newId;
  ticks = 0;
  microsecond = 0;
  millisecond = 0;
  second = 0;
  minute = 0;
  hour = 0;
}

void Clock::tick() {
  ticks++;
  System_printf("id %d : %d ticks, %d:%d\n", getId(), ticks, second, millisecond);

  if (getId() == 1) {
    // id 1 expires every 100 ticks (and each tick is 1 millisecond)
    setMillisecond(100);
  }
  if (getId() == 2) {
    setSecond();
    if (ticks == 2) {
      clockTerminate(0);
    }
  }
}

void Clock::setMicrosecond() {
  if (microsecond >= 999) {
    setMillisecond();
    microsecond = 0;
  } else {
    microsecond++;
  }
}

void Clock::setMillisecond() {
  if (millisecond >= 999) {
    setSecond();
    millisecond = 0;
  } else {
    millisecond++;
  }
}

void Clock::setMillisecond(int nMilliseconds) {
  int secs;
  millisecond += nMilliseconds;
  secs = millisecond / 1000;
  millisecond %= 1000;
  while (secs--) setSecond();
}

void Clock::setSecond() {
  if (second == 59) {
    setMinute();
    second = 0;
  } else {
    second++;
  }
}

void Clock::setMinute() {
  if (minute == 59) {
    setHour();
    minute = 0;
  } else {
    minute++;
  }
}

void Clock::setHour() {
  if (hour == 23) {
    hour = 0;
  } else {
    hour++;
  }
}

