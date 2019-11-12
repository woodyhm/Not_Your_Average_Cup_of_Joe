#!/usr/bin/env python
import Adafruit_BBIO.GPIO as GPIO
from datetime import datetime
import threading

brew = "P9_12"
on = GPIO.HIGH
off = GPIO.LOW

# Setting up GPIO to turn coffee pot on and off
GPIO.setup(brew, GPIO.OUT)
GPIO.setup(brew, GPIO.OUT, pull_up_down=GPIO.PUD_DOWN)

#Setting up date and time information
now = datetime.now()

#New Brew Time input from user
usr = datetime(2019,11,11,20,03) # Set by the website eventually


def main():
    new_coffee()

def new_coffee():
    if usr>now:            
        print("Time Accepted!")
        start_timer()
    else:
        print("Invalid Date or Time")
    

def start_timer():
    usr_seconds = usr.hour * 3600 + usr.minute * 60 + usr.second
    now_seconds = now.hour * 3600 + now.minute * 60 + now.second
    time_to_brew = usr_seconds-now_seconds
    timer = threading.Timer(time_to_brew, start_brewing)
    timer.start()


def start_brewing():
    print("Coffee brewing")
    GPIO.output(brew, on)
    stop_time = threading.Timer(10,stop_brewing)
    stop_time.start()
def stop_brewing():
    print("Coffee has been made")
    GPIO.output(brew, off)
    

#time_remaining = (usr.hour*3600+usr.minute*60+usr.second)-(now.hour*3600+now.minute*60+now.second) #seconds
#timer = threading.Timer(time_remaining, brewing)
#timer.start()

#
# If user presses the "Make me coffee now" button on website 
#
#usr = datetime.now()

# Checking date and time validity
if usr<now:
    print("Invalid Date or Time")


if __name__ == '__main__':
    main()