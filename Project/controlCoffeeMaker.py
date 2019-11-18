#!/usr/bin/env python

import Adafruit_BBIO.GPIO as GPIO
from datetime import datetime
import threading
import time

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

#might need to make document link dynamic
status_ref = db.collection(u'CoffeeMakers').document(u'n55uJF7D79BprQ6bgaiD')



brew = "P9_12"
on = GPIO.HIGH
off = GPIO.LOW

# Setting up GPIO to turn coffee pot on and off
GPIO.setup(brew, GPIO.OUT)
GPIO.setup(brew, GPIO.OUT, pull_up_down=GPIO.PUD_DOWN)

#Setting up date and time information
now = datetime.now()

#New Brew Time input from user
usr = datetime(2019,11,12,20,3) # Set by the website eventually

GPIO.output(brew, off)

# try: 
#     status = status_ref.get()
#     print(format(status.to_dict()[u'isBrewing']))
    
# except google.cloud.exception.NotFound:
#     print(u'No data found')

count = 0;

usr = datetime.now()

#-----------------------------------------------
#Schedule Array

schedule_array = []
#-----------------------------------------------


def main():
    
    while (True):
        status = status_ref.get()
        # print(format(status.to_dict()[u'isBrewing']))
        if (format(status.to_dict()[u'isBrewing']) == "True"):
            print("About to start brewing")
            start_brewing()
        time.sleep(10)
        # requests.post(status_ref + 'serviceAccountKey.json', json.dumps(false)) # Posts things to firebase
        
        
        print(format(status.to_dict()[u'isBrewing']))
        while (format(status.to_dict()[u'isBrewing']) == "False"):
            status = status_ref.get()
            print("Blah")
    
        #-----------------------------------------------
        #Scheduling
        
        # Assuming I have an array:
        # [year, month, day, hour, minute]
        
        newtime = datetime(year, month, day, hour, minute)
        
        # Check if newtime is already in array. If so, ignore.
        # If newtime isn't in array, add it to the array
        
        for x in schedule_array:
            if x == newtime:
                print("This time already exists on the schedule")
                break
            else:
                print("Scheduled coffee at: ", x)
                schedule_array.append(newtime)
        
        # Check if scheduled time has passed
        
        for y in schedule_array:
            if y <= now:
                print("Scheduled coffee at ", y, " is starting")
                start_brewing()
            
        
        #-----------------------------------------------
            
        
        
        
        
            
    
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
    time.sleep(10)
    
def stop_brewing():
    print("Coffee has been made")
    GPIO.output(brew, off)
    

if __name__ == '__main__':
    main()