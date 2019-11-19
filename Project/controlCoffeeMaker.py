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

#--------------------------------------------------------------
schedule_queue = []
#--------------------------------------------------------------


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
        
        newtime = 0
        oldtime = 0
        
        while (format(status.to_dict()[u'isBrewing']) == "False"):
            status = status_ref.get()
            now = datetime.now()
            print(now)
            
            
            #getting time from firebase and converting it to usable format
            newtime_string = format(status.to_dict()[u'scheduleBrewTime'])
            newtime_array = datetime_parser(newtime_string)
            
            
            year = newtime_array[0]
            month = newtime_array[1]
            day = newtime_array[2]
            hour = newtime_array[3]
            minute = newtime_array[4]
            newtime = datetime(year,month,day,hour,minute)
            time.sleep(1)
           
            
            if oldtime != newtime:    
                if newtime not in schedule_queue:
                    oldtime = newtime
                    schedule_queue.append(newtime)
                    print("Queue updated")
                    print(schedule_queue)
            
            for element in schedule_queue:
                if element<=now:
                    isBrewing = True
                    print("isBrewing", isBrewing)
                    schedule_queue.remove(element)
                    print(schedule_queue)
                    start_brewing()
            
        #     status = status_ref.get()
        #     print("Blah")
    
        
def start_timer():
    usr_seconds = usr.hour * 3600 + usr.minute * 60 + usr.second
    now_seconds = now.hour * 3600 + now.minute * 60 + now.second
    time_to_brew = usr_seconds-now_seconds
    timer = threading.Timer(time_to_brew, start_brewing)
    timer.start()
    
def start_brewing():
    print("Coffee brewing")
    GPIO.output(brew, on)
    stop_time = threading.Timer(180,stop_brewing)
    stop_time.start()
    #time.sleep(300)
    
def stop_brewing():
    print("Coffee has been made")
    GPIO.output(brew, off)

def datetime_parser(date_string):
    year = int(date_string[0:4])
    month = int(date_string[5:7])
    day = int(date_string[8:10])
    hour = int(date_string[11:13])
    minute = int(date_string[14:16])
    return [year, month, day, hour, minute]

if __name__ == '__main__':
    main()