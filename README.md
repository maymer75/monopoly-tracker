# monopoly-tracker
A simple web app for keeping track of game pieces collected in the Vons/Safeway monopoly game.
This project has been updated for the 2017 version of the game that runs from February 8, 2017
through May 9th, 2017.


# Installing and Running
This project is designed to run locally on a system that has both NodeJS and MongoDB installed. To run it perform the following steps:

1. Clone the repository (or extract the zip archive).
2. Start the mongod service running in a command window.
3. Open a second command window, cd to the project folder.
4. Run `mongoimport –db=monopoly –collection=codes –file=monop-codes.json` to import the game codes with empty counts.
5. Run `npm install` to install dependencies.
6. Run `node monopsv.js` to run the server script.
7. In a browser navigate to http://localhost:8081/monop.html

After step 7 you should see the Monopoly Tracker webpage come up with the Add tab selected by default.


# Using
This app consists of 3 different tabs:


Create
------
The create tab is used to create new codes that can be collected. If you imported the codes as described in the
Installing and Running section then you will not need to use this tab, since the import file contains all of the
codes found on the game board.


Add
---
Use this tab to add the codes of the game pieces you collect. In the 2017 variation, codes used by this app consist
of only 3 characters from the actual 5 character code found on the tickets. To enter a code, in the edit box type
in the FIRST 2 characters of the code followed by the LAST character. For example to enter the code for the game
piece `8L58B` you would enter the characters `8LB` in the box and press Enter (or click the Add button). I recommend
pressing Enter as this keeps focus in the text box so it's immediately ready for you to enter another code in.


Status
------
Use this tab to see a list of all of the possible codes and the counts for how many of each you have collected.
Codes that you have collected at least 1 of will be highlited in green in this list.


Sounds
------
I added some home made sounds to read back codes entered. Further if it is the first time collecting that code you'll
hear a DING! preceding the code, letting you know that it's a new one. There is currently not support for recognizing
when a full prize group has been collected, so if you enter a new code check the Status tab when you're done to see
if you have all of a group.

Of course, the sound recording is pretty bad, so if you don't want to hear it you can uncheck the "Read Codes" checkbox
to leave out the reading back of the codes. Also if you are so inclined you could always put your own MP3 files over
the recordings in the `public/snd` folder and refresh the web page.


# More Information
I used this project as a way to learn more about NodeJS and web programming. Looking over the board and
trying to attach game pieces took too long, especially when some of the pieces were found on opposite sides
of the board requiring you to flip it over often. This app allows you to type in the codes, saving time, so
it was a good learning experience that's actually useful.
