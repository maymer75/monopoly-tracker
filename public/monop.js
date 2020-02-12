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
    { min: 601, max: 607, group: "A", title: "$1,000,000 Cash" },
    { min: 608, max: 614, group: "B", title: "$250,000 Vacation Home" },
    { min: 615, max: 619, group: "C", title: "$10,000 Cash" },
    { min: 620, max: 623, group: "D", title: "$5 Cash" },
    { min: 624, max: 627, group: "E", title: "$20 Grocery Gift Card" },
    { min: 628, max: 633, group: "F", title: "$25,000 Home Theater" },
    { min: 634, max: 637, group: "G", title: "$50 Grocery Gift Card" },
    { min: 638, max: 641, group: "H", title: "$100 Grocery Gift Card" },
    { min: 642, max: 647, group: "J", title: "$40,000 Vehicle of Choice" },
    { min: 648, max: 651, group: "K", title: "$250 Grocery Gift Card" },
    { min: 652, max: 655, group: "L", title: "$500 Portable Grill &amp; Groceries" },
    { min: 656, max: 661, group: "M", title: "$100,000 Cash or Boat" },
    { min: 662, max: 665, group: "N", title: "$1,000 Cash" },
    { min: 667, max: 670, group: "P", title: "$5,000 Groceries" },
];

var gInstructionText = "To enter a code from a game piece, type the three digit number from it."

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
