# ULongDate

Library for reading and writing 8 byte dates, for more efficient storage and transport.

# Format

  Full Year   : 22 bits, minimum value 0, maximum value 4194303.<br>
  Month Day   : 5 bits, minimum value 1, maximum value 31.<br>
  Month       : 4 bits, minimum value 0(january), maximum value 15(above 11 can be handled specially but won't occur naturally)<br>
  Hours       : 5 bits, minimum value 0, maximum value 31.<br>
  Minutes     : 6 bits, minimum value 0, maximum value 63.<br>
  Seconds     : 6 bits, minimum value 0, maximum value 63.<br>
  Milliseconds: 10 bits, minimum value 0, maximum value 1023.<br>
  Timezone    : 6 bits, minimum value -32, maximum value 31.<br>
  ^Used as the hour offset from GMT/UTC, with anything below -23 and above 23 available for special use cases.
