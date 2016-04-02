// monopsv.js - Monopoly Server Script (NodeJS)
var express = require('express');
var bodyParser = require('body-parser');

// MongoDB setup (database storage)
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var dburl = "mongodb://localhost:27017/monopoly";
//var dburl = "mongodb://localhost:27017/monop-test";

// Utils
var assert = require('assert');

// Express app to process HTTP requests from browser
var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// Store static files to be served in the 'public' sub-folder
app.use(express.static('public'));

// POST request to create a new code
app.post('/ccreate', function(req, res) {
	MongoClient.connect(dburl, function(err, db) {
		assert.equal(null, err);
		console.log("create_code: " + req.body.code);
        
		var finalCode = req.body.code.toUpperCase();
        
		// Search for existing code
		db.collection('codes').find( { 'code':finalCode } ).toArray().then(function(found) {
            if (found.length > 0) {
                console.log("Code already exists: " + finalCode);
                db.close();
                res.end(JSON.stringify( { result:true, message:"Code already exists." } ));
            } else {
                // Add it into the DB.. MY MAN!!!
                db.collection('codes').insertOne( {
                    "code": finalCode,
                    "count": 0
                }, function(err, result) {
                    console.log("Added code: " + finalCode);
                    db.close();
                    res.end(JSON.stringify( { result:true, message:"Added code: " + finalCode } ));
                });
            }
        });
	});
});

// POST request to add a code you have, the code must exist in the DB already this just
// increments the count indicating how many game pieces you have of that code.
app.post('/cadd', function(req, res) {
    // TODO: Use the $inc modifier?
	MongoClient.connect(dburl, function(err, db) {
		assert.equal(null, err);
		console.log("check_code: " + req.body.code);
		
		var finalCode = req.body.code.toUpperCase();
        
		// Search for existing code
		db.collection('codes').find( { 'code':finalCode } ).toArray().then(function(found) {
            if (found.length === 0) {
                console.log("Add for INVALID code: " + finalCode);
                res.end(JSON.stringify( { result:0, message:"The code you entered is invalid. Enter only the first and last letter of the code on a game piece." } ));
            } else {
                found = found[0];
            }
            
            found.count = found.count + 1;
            
            db.collection('codes').update( { 'code':finalCode }, found, function() {
                console.log("Updated code: " + finalCode + " (" + found.count + ")");
                db.close();
                res.end(JSON.stringify(found));
            });
        });
    });
});

// GET request to retrieve all of the codes from the database
app.get('/cstatus', function(req, res) {
	MongoClient.connect(dburl, function(err, db) {
		assert.equal(null, err);
		
		// Just return the entire database :)
		db.collection('codes').find( {} ).toArray().then(function(found) {
            console.log("Got everything.");
            db.close();
            
            // Sort the array by code
            found.sort(function(a, b) { return (a.code < b.code) ? -1 : (a.code == b.code) ? 0 : 1; });
            
            res.end(JSON.stringify(found));
        });
    });
});

// Start listening on port 8081
var server = app.listen(8081, function() {
    console.log(server.address());
    
    var host = server.address().address;
    var port = server.address().port;
    
    console.log("Monopoly Server listening at http://%s:%s", host, port);
});
