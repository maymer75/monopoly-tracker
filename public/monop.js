// Monopoly Tracker js code
// By: Jason L. Maynard

// Don't change this! To change the initially visible page change the
// showContent() call at bottom of initPage() function instead.
var gCurPage = 'create';

var gAudio = {};        // Audio objects, key is the associated letter from a code, or base filename for non-code audio
var gPlaylist = [];     // Queue of audio files to play in sequence
var gAudioFiles = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r',
                    's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '$', 'question', 'ding1', 'dingx', 'winner', 'wrong',
                    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0' ];

var gReadCodes = true;

// Use all uppercase letters in codes here to match how the database stores them.
var gPrizeGroups = {
    '8B': '$20,000 College Tuition',
    '8C': '$35,000 Vehicle of Your Choice',
    '8D': '$40,000 Home Makeover',
    '8E': '$100,000 Cash or Luxury Car',
    '8F': '$5,000 Cash',
    '8G': '$5,000 Groceries',
    '8H': '$1,500 Gas Grill<br>&amp; Groceries',
    '8J': '$1,500 LED HD TV',
    '8K': '$1,000 Cash',
    '8L': '$1,000 Grocery<br>Gift Card',
    '8M': '$1,000 Laptop<br>Computer',
    '8N': '$500 Grocery<br>Gift Card',
    '8P': '$300 Smart Watch',
    '8Q': '$200 Family Picnic',
    '8R': '$200 Cash',
    '8S': '$100 Grocery<br>Gift Card',
    '8T': '$100 Cash',
    '8V': '$50 Grocery<br>Gift Card',
    '8W': '$25 Grocery<br>Gift Card',
    '8X': '$25 Gift Card Mall',
    '8Y': '$1 Million Vacation Home',
    '8Z': '$1 Million Cash',
    '9A': '$10,000 4-Wheeler',
    '9B': '$10,000 Family Vacation',
    '9C': '$25 Cash',
    '9D': 'Fandango Gift Card',
    '9E': '$15 Gift Card',
    '9F': '$10 Grocery<br>Gift Card',
    '9G': '$10 Cash',
    '9H': '$5 Grocery<br>Gift Card',
}

var gInstructionText = "To enter a code from a game piece, type the first two characters followed by the last character."


// ---- loadAudio -----------------------------------------
function loadAudio()
{
    for(i = 0; i < gAudioFiles.length; i++) {
        var k = gAudioFiles[i];
        var a = new Audio('snd/' + k + '.mp3');
        
        if (a) {
            a.addEventListener('ended', function() {
                // Remove this sound from the queue once it's done
                gPlaylist.shift();
                
                // Start next one playing (stays in queue until finished)
                if (gPlaylist.length > 0) {
                    var next = gPlaylist[0];
                    gAudio[next].play();
                }
            });
            
            gAudio[k] = a;
        }
    }
    
    // Create ? alias for question.mp3 (because is ? in codes, but ? is not a valid character for a filename)
    gAudio['?'] = gAudio['question'];
}

// ---- playAudio -----------------------------------------
function playAudio(name)
{
    var a = gAudio[name];
    
    if (a) {
        gPlaylist.push(name);
        
        // If no other sound was playing (aka in the queue) then start this one going
        // immediately, otherwise the 'ended' event handler will eventually get to it.
        if (gPlaylist.length == 1) {
            a.play();
        }
    }
}

// ---- initPage ------------------------------------------
function initPage()
{
    // Custom AJAX submit of Create form instead of loading a new page
    $("#create-form").on("submit", function(event) {
        // Prevent default handling of submit (loading new page)
        event.preventDefault();
        
        var url = $(this).attr('action');
        var data = $(this).serialize();
        
        $.ajax({
            type: "post",
            url: url,
            data: data,
            contentType: "application/x-www-form-urlencoded",
            success: function(responseData, textStatus, jqXHR) {
                $("#results-text").html(responseData);
                $("#results-div").css('display', 'block');
            },
            error: function(jqXHR, textStatus, errorThrown) {
                $("#results-text").html(textStatus);
                $("#results-div").css('display', 'block');
            }
        });
    });

    // Custom AJAX submit of Add form instead of loading a new page
    $("#add-form").on("submit", function(event) {
        // Prevent default handling of submit (loading new page)
        event.preventDefault();
        
        var url = $(this).attr('action');
        var data = $(this).serialize();
        
        $.ajax({
            type: "post",
            url: url,
            data: data,
            contentType: "application/x-www-form-urlencoded",
            dataType: "json",
            success: function(responseData, textStatus, jqXHR) {
                $("#results-text").html(JSON.stringify(responseData, null, 2));
                $("#results-div").css('display', 'block');
                $("#add-form input:text").val('');

                var resp = responseData;

                if (resp.count > 1) {
                    playAudio('dingx');
                    readCode(resp.code);
                } else {
                    if (!resp.code) {
                        // The code entered was not valid
                        playAudio('wrong');
                        $('#results-text').html(resp.message + '<br><br>' + gInstructionText);
                        $('#results-div').css('display', 'block');
                    } else {
                        // Check if a prize is won after adding a new piece
                        checkForPrize(resp.code, function(groupKey, won) {
                            if (won) {
                                playAudio('winner');
                                $('#results-text').html("You won " + gPrizeGroups[groupKey] + "!!!");
                            } else {
                                playAudio('ding1');
                                readCode(resp.code);
                            }
                        });
                    }
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                playAudio('wrong');     // just so user knows there's an error
                $("#results-text").html(textStatus);
                $("#results-div").css('display', 'block');
            },
        });
    });
    
    loadAudio();
    
    showContent('add', true);
}

// ---- checkForPrize -------------------------------------
// Check if given code's prize group has been won. Callback is a function
// called when status is determined whose parameters are the groupKey and
// won flag (won flag is null if an error occurred, otherise boolean)
function checkForPrize(code, callback)
{
    var groupKey = code.substring(0,2);
    var prize = gPrizeGroups[groupKey];

    if (prize) {
        console.log("Checking for prize: " + groupKey);

        var data = "code=" + groupKey + ".";

        $.ajax({
            type: "post",
            url: '/cgroup',
            data: data,
            contentType: "application/x-www-form-urlencoded",
            dataType: "json",
            success: function(responseData, textStatus, jqXHR) {
                var resp = responseData;
                var won = true;

                for(var i = 0; i < resp.length; i++) {
                    if (resp[i].count <= 0) {
                        won = false;
                        break;
                    }
                }

                console.log('checkForPrize(' + groupKey + ') Result: ' + won);

                if (callback) {
                    callback(groupKey, won);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log('checkForPrize(' + groupKey + ') Error: ' + errorThrown);
                if (callback) {
                    callback(groupKey, null);
                }
            },
        });
    } else {
        console.log('checkForPrize(' + code + ') Error: No prize group associated with this code.');

        if (callback) {
            callback(groupKey, null);
        }
    }
}

// ---- showContent ---------------------------------------
function showContent(contentId, bForce)
{
    if ((contentId != gCurPage) || bForce) {
        // Hide results div after any time the selected page changes
        $('#results-div').css('display', 'none');
        
        // Hide the old and show the new
        $('#'+gCurPage+'-div').css('display', 'none');
        $('#'+contentId+'-div').css('display', 'block');
        
        // Change selected nav button
        $('#'+gCurPage).removeClass('tab-selected').addClass('tab-unselected');
        $('#'+contentId).removeClass('tab-unselected').addClass('tab-selected');
        
        gCurPage = contentId;
    }
}

// ---- onCreate ------------------------------------------
function onCreate()
{
    showContent('create');
}

// ---- onAdd ---------------------------------------------
function onAdd()
{
    showContent('add');
}

// ---- onStatus ------------------------------------------
function onStatus()
{
    showContent('status');
    
    $.ajax({
        accepts: "application/json",
        type: "get",
        url: "/cstatus",
        success: function(responseData, textStatus, jqXHR) {
            // For debugging enable this to show JSON returned by the query
            //$("#results-text").html(responseData);
            //$("#results-div").css('display', 'block');
            
            var found = JSON.parse(responseData);
            
            // Also go ahead and add rows to the table, collect them in one string then append it.
            $("#status-items tr").remove();
            
            var str = "";
            var i, blk, key, prevGroup;
            var groups = {};
            var prizeClass = "prize-even";

            // Count number of codes in each group (codes are in a group if the first two characters match)
            for (i = 0; i < found.length; i++) {
                blk = found[i];
                key = blk.code.substring(0,2);
                if (groups[key] === undefined) {
                    groups[key] = 0;
                }
                groups[key]++;
            }

            for (i = 0; i < found.length; i++) {
                blk = found[i];
                key = blk.code.substring(0,2);

                // Toggle prize color before adding the new prize row when the group changes, doing this first
                // because uncollected pieces use the class of their associated prize to make reading easier.
                if (key != prevGroup) {
                    prizeClass = (prizeClass == 'prize-even') ? 'prize-odd' : 'prize-even';
                }

                if(blk.count > 0) {
                    str += '<tr><td class="collected">' + blk.code + '</td><td class="collected">' + blk.count + '</td>';
                } else {
                    str += '<tr><td class="' + prizeClass + '">' + blk.code + '</td><td class="' + prizeClass + '">' + blk.count + '</td>';
                }

                if (key != prevGroup) {
                    prevGroup = key;
                    str += '<td rowspan="' + groups[key] + '" class="' + prizeClass + '">';

                    if (gPrizeGroups[key]) {
                        str += gPrizeGroups[key];
                    } else {
                        str += "Unknown Prize";
                    }

                    str += '</td></tr>';
                } else {
                    str += '</tr>';
                }
            }
            
            $("#status-items").append(str);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            $("#results-text").html(textStatus);
            $("#results-div").css('display', 'block');
        }
    });
}

// ---- applyRead -----------------------------------------
// Called when the checked state of the 'read' checkbox is changed.
function applyRead()
{
    var cbox = document.getElementsByName('read')[0];
    gReadCodes = cbox.checked;
    //console.log("applyRead: checked=" + cbox.checked + ", flag=" + gReadCodes);
}

// ---- readCode ------------------------------------------
// Queues the audio to read back the given code
function readCode(code, bForce)
{
    if(gReadCodes || bForce) {
        playAudio(code[0].toLowerCase());
        playAudio(code[1].toLowerCase());
        playAudio(code[2].toLowerCase());
    }
}
