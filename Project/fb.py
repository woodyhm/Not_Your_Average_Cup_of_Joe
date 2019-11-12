
from time import sleep

from firebase import firebase

# import urllib2, urllib, httplib
import json
import os 
from functools import partial



# GPIO.setmode(GPIO.BCM)
# GPIO.cleanup()
# GPIO.setwarnings(False)



# sensor = Adafruit_DHT.DHT11
# # Example using a Beaglebone Black with DHT sensor
# # connected to pin P8_11.
# pin = 4



fb = firebase.FirebaseApplication('https://not-your-average-cup-of-joe.firebaseio.com/', None)

authentication = firebase.Authentication("123456","woody@fake.com")

def update_firebase():
    result = fb.get('/CoffeeMakers', None)
    print(result);
	

while True:
		update_firebase()
		
        #sleepTime = int(sleepTime)
		sleep(5)