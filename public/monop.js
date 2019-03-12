// Monopoly Tracker js code
// By: Jason L. Maynard

// Don't change this! To change the initially visible page change the
// showContent() call at bottom of initPage() function instead.
var gCurPage = 'create';

var gAudio = {};        // Audio objects, key is the associated letter from a code, or base filename for non-code audio
var gPlaylist = [];     // Queue of audio files to play in sequence
var gAudioFiles = [ 'ding1', 'dingx', 'winner', 'wrong' ];

// Use all uppercase letters in groups/codes here to match how the database stores them.
var gPrizeGroups = [
    { min: 301, max: 304, group: "A", title: "$5,000 Cash" },
    { min: 305, max: 308, group: "B", title: "$5,000 Groceries" },
    { min: 309, max: 312, group: "C", title: "$2,000 Plated.com Gift Card" },
    { min: 313, max: 316, group: "D", title: "$2,000 Fandango Movies for a Year" },
    { min: 317, max: 320, group: "E", title: "$1,000 Cash" },
    { min: 321, max: 324, group: "F", title: "$1,000 Grocery Gift Card" },
    { min: 325, max: 328, group: "G", title: "$500 Portable Grill &amp; Groceries" },
    { min: 329, max: 332, group: "H", title: "$500 Grocery Gift Card" },
    { min: 333, max: 338, group: "I", title: "$1 MILLION Cash" },
    { min: 339, max: 344, group: "J", title: "$1 MILLION Vacation Home" },
    { min: 345, max: 348, group: "K", title: "$5 Cash" },
    { min: 349, max: 352, group: "L", title: "$5 Grocery Gift Card" },
    { min: 353, max: 356, group: "M", title: "$10 Cash" },
    { min: 357, max: 360, group: "N", title: "$10 Grocery Gift Card" },
    { min: 361, max: 364, group: "O", title: "$20 Cash" },
    { min: 365, max: 368, group: "P", title: "$25 Cash" },
    { min: 369, max: 372, group: "Q", title: "$25 Grocery Gift Card" },
    { min: 373, max: 376, group: "R", title: "$50 Grocery Gift Card" },
    { min: 377, max: 380, group: "S", title: "$100 Cash" },
    { min: 381, max: 384, group: "T", title: "$100 Grocery Gift Card" },
    { min: 385, max: 388, group: "U", title: "$200 Family Picnic" },
    { min: 389, max: 392, group: "V", title: "$300 Wireless Headphones" },
    { min: 393, max: 397, group: "W", title: "$100,000 Cash or Boat" },
    { min: 398, max: 402, group: "X", title: "$30,000 Pair of Jet Skis" },
    { min: 403, max: 407, group: "Y", title: "$25,000 Home Theater" },
    { min: 408, max: 412, group: "Z", title: "$20,000 College Tuition" },
    { min: 413, max: 417, group: "$", title: "$10,000 Cash" },
    { min: 418, max: 422, group: "#", title: "$7,500 Family Vacation" },
];

var gInstructionText = "To enter a code from a game piece, type only the first three numbers from it."

function prizeGroupFromCode(code) {
    for(var i = 0; i < gPrizeGroups.length; i++) {
        var group = gPrizeGroups[i];
        if (code >= group.min && code <= group.max) {
            return i;
        }
    }
}

function prizeGroupFromGroup(group) {
    for(var i = 0; i < gPrizeGroups.length; i++) {
        if (gPrizeGroups[i].group === group) {
            return i;
        }
    }
}

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
                    //readCode(resp.code);
                } else {
                    if (!resp.code) {
                        // The code entered was not valid
                        playAudio('wrong');
                        $('#results-text').html(resp.message + '<br><br>' + gInstructionText);
                        $('#results-div').css('display', 'block');
                    } else {
                        // Check if a prize is won after adding a new piece
                        checkForPrize(resp.group, function(prize, won) {
                            if (won) {
                                playAudio('winner');
                                $('#results-text').html("You won " + prize.title + "!!!");
                            } else {
                                playAudio('ding1');
                                //readCode(resp.code);
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
function checkForPrize(groupKey, callback)
{
    var prize = prizeGroupFromGroup(groupKey);

    if (prize !== undefined) {
        prize = gPrizeGroups[prize];

        console.log("Checking for prize group: " + prize.group);

        var data = "code=" + prize.group;

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
                    callback(prize, won);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log('checkForPrize(' + groupKey + ') Error: ' + errorThrown);
                if (callback) {
                    callback(prize, null);
                }
            },
        });
    } else {
        console.log('checkForPrize(' + groupKey + ') Error: No prize group associated with this code.');

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
                var code = Number(blk.code);
                key = prizeGroupFromCode(code); // blk.code.substring(0,2);
                if (groups[key] === undefined) {
                    groups[key] = 0;
                }
                groups[key]++;
            }

            for (i = 0; i < found.length; i++) {
                blk = found[i];
                key = prizeGroupFromCode(Number(blk.code)); //blk.code.substring(0,2);

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
                        str += gPrizeGroups[key].title;
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
