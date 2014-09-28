var vibrate = getURLParameter('vibrate');
var focus = getURLParameter('focus');
var unit = getURLParameter('unit');
var loc = getURLParameter('loc');

vibrate = decodeURIComponent(vibrate);
focus = decodeURIComponent(focus);
unit = decodeURIComponent(unit);
loc = decodeURIComponent(loc);

$(document).ready(function () {
    if (!navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
        $('#js-header').show();
        $('.js-pages').addClass('navbar-through');
        $('.js-pages').addClass('toolbar-through');
    }

    if (vibrate !== undefined && vibrate === true) {
        $("#js-vibrate-title").removeClass('inactive');
        $("#js-vibrate").prop('checked', true);
    }

    if (focus !== undefined && $("#js-focus-" + focus).length !== 0) {
        $(".js-focus").removeClass('active');
        $("#js-focus-" + focus).addClass('active');
    }

    if (unit !== undefined && $("#js-unit-" + unit).length !== 0) {
        $(".js-unit").removeClass('active');
        $("#js-unit-" + unit).addClass('active');
    }

    if (loc !== undefined && $("#js-loc-" + loc).length !== 0) {
        $(".js-loc").removeClass('active');
        $("#js-loc-" + loc).addClass('active');
    }

    $(".js-focus").click(function () {
        $(".js-focus").removeClass('active');
        $(this).addClass('active');
    });

    $(".js-unit").click(function () {
        $(".js-unit").removeClass('active');
        $(this).addClass('active');
    });

    $(".js-loc").click(function () {
        $(".js-loc").removeClass('active');
        $(this).addClass('active');
    });

    $("#js-vibrate").change(function () {
        if ($("#js-vibrate").is(':checked')) {
            $("#js-vibrate-title").removeClass('inactive');
        }
        else {
            $("#js-vibrate-title").addClass('inactive');
        }
    });

    $("#js-button-cancel").click(function() {
        console.log("Cancel triggered");
        document.location = "pebblejs://close";
    });

    $("#js-button-save").click(function() {
        console.log("Save triggered");

        var location = "pebblejs://close#" + encodeURIComponent(JSON.stringify(saveOptions()));
        console.log("Saving to: " + location);
        document.location = location;
    });
});

function getURLParameter(name) {
  return decodeURI(
      (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
  );
}

function saveOptions() {
    var vibrate = $("#js-vibrate").is(':checked');
    var focus = $(".js-focus.active").data('focus');
    var unit = $(".js-unit.active").data('unit');
    var loc = $(".js-loc.active").data('loc');

    var options = {
      'vibrate': vibrate,
      'focus': focus,
      'unit': unit,
      'loc': loc
    };
    return options;
}