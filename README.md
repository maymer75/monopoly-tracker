# monopoly-tracker
A simple web app for keeping track of game pieces collected in the Vons/Safeway monopoly game.

# Running
This project is designed to run locally on a system that has both NodeJS and MongoDB installed. To run it perform the following steps:

1. Clone the repository (or extract the zip archive).
2. Start the mongod service running in a command window.
3. Open a second command window, cd to the project folder.
4. Run mongoimport –db=monopoly –collection=codes –file=monop-codes.json to import the set of codes with empty (zero) counts (so you don’t have to create them all manually).
5. Run npm install to install dependencies.
6. Run node monopsv.js to run the server script.
7. In a browser navigate to http://localhost:8081/monop.html

After step 7 you should see the Monopoly Tracker webpage come up with the Add tab selected by default.

# More Information
I am using this project to describe what I've learned while working on it in the first blog at my website. If you are interested in reading about the development process you can check it out at (http://drunkware.com/?p=18).
