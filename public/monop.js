// Monopoly Tracker js code
// By: Jason L. Maynard

// Don't change this! To change the initially visible page change the
// showContent() call at bottom of initPage() function instead.
var gCurPage = 'create';

var gAudio = {};        // Audio objects, key is the associated letter from a code, or base filename for non-code audio
var gPlaylist = [];     // Queue of audio files to play in sequence
var gAudioFiles = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r',
                    's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '$', 'question', 'ding1', 'dingx', 'winner' ];

var gReadCodes = true;

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
                $("#results-text").text(responseData);
                $("#results-div").css('display', 'block');
            },
            error: function(jqXHR, textStatus, errorThrown) {
                $("#results-text").text(textStatus);
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
            success: function(responseData, textStatus, jqXHR) {
                $("#results-text").text(responseData);
                $("#results-div").css('display', 'block');
                $("#add-form input:text").val('');
                
                var resp = JSON.parse(responseData);
                
                if (resp.count > 1) {
                    playAudio('dingx');
                    
                } else {
                    playAudio('ding1');
                }
                
                if (gReadCodes) {
                    playAudio(resp.code[0].toLowerCase());
                    playAudio(resp.code[1].toLowerCase());
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                $("#results-text").text(textStatus);
                $("#results-div").css('display', 'block');
            },
        });
    });
    
    loadAudio();
    
    showContent('add', true);
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
            //$("#results-text").text(responseData);
            //$("#results-div").css('display', 'block');
            
            var found = JSON.parse(responseData);
            
            // Also go ahead and add rows to the table, collect them in one string then append it.
            $("#status-items tr").remove();
            
            var str = "";
            
            for (i = 0; i < found.length; i++) {
                var blk = found[i];
                
                if(blk.count > 0) {
                    str = str + '<tr style="background-color:lightgreen"><td>' + blk.code + '</td><td>' + blk.count + '</td></tr>';
                } else {
                    str = str + '<tr><td>' + blk.code + '</td><td>' + blk.count + '</td></tr>';
                }
            }
            
            $("#status-items").append(str);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            $("#results-text").text(textStatus);
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
