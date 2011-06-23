function timeSince(from, to) {
    function _timeSince(from, to) {
        var distance = to - from;
        if (distance < 0) { return [0, '']; }
        if (distance < 1000) { return [distance, 'millisecond']; }
        distance = Math.floor(distance / 1000);
        if (distance < 60) { return [distance, 'second']; }
        distance = Math.foor(distance / 60);
        if (distance < 60) { return [distance, 'minute']; }
        distance = Math.floor(distance / 60);
        if (distance < 24) { return [distance, 'hour']; }
        distance = Math.floor(distance / 24);
        if (distance < 30) { return [distance, 'day']; }
        distance = Math.floor(distance / 30);
        if (distance < 12) { return [distance, 'month']; }
        distance = Math.floor(distance / 12);
        return [distance, 'year'];
    }
    var timeSince = _timeSince(from, to);
    if (!timeSince[0]) { return 'just now'; }
    if (timeSince[0] == 1) {
        return timeSince[0] + ' ' + timeSince[1] + ' ago';
    }
    return timeSince[0] + ' ' + timeSince[1] + 's ago';
}

function parseURI() {
    var popup_uri = window.location.href;
    var token = "escaped_uri=";
    var pos = popup_uri.indexOf(token);
    var uri = null;
    if (pos >= 0 && popup_uri.length > pos + token.length) {
        uri = popup_uri.substr(pos + token.length);
    }
    return uri;
}

function sendRedditSearch(uri) {
    var uri = parseURI();
    if (!uri) {
        $('#result-none').show();
        return;
    }
    reddit_uri = "http://www.reddit.com/search.json"
        + "?sort=top"
        + "&q=" + uri;
    reddit_uri = "http://www.reddit.com/submit?url=" + uri;
    chrome.extension.sendRequest(
        {"action": "get", "url": reddit_uri}, parseRedditResponse);
}

function parseRedditResponse(response) {
    var data = null;
    var page = $(response);
    var results = $('#siteTable', page).children('.thing');
    if (results.length == 0) {
        $('#result-none').show();
        return;
    }

    $('#results').empty().show();
    for (var i = 0; i < Math.min(10, results.length); i++) {
        $('a', results[i]).attr('target', '_new');
        $(results[i]).appendTo($('#results'));
        $('#results').append('<div class="clearleft" />');
    }
    return;
    var results = data.data.children || [];
    for (var i = 0; i < Math.min(10, results.length); i++) {
       var result = results[i].data;
       var e = $('#result-template').clone();
       $('.rank', e).html(i + 1);
       $('a.title', e).attr('href', result.url);
       $('a.title', e).html(result.title);
       $('.domain > a', e).attr(
           'href', 'http://www.reddit.com/domain/' + result.domain + '/')
       $('.domain > a', e).html(result.domain);
       $('.dislikes', e).html(result.downs);
       $('.unvoted', e).html(Math.max(0, result.ups - result.downs));
       $('.likes', e).html(result.ups);
       $('.author', e).attr(
           'href',
           'http://www.reddit.com/user/' + encodeURIComponent(result.author));
       $('.author', e).html(result.author);
       $('.subreddit', e).attr(
           'href',
           'http://www.reddit.com/r/' + encodeURIComponent(result.subreddit));
       $('.subreddit', e).html(result.subreddit);
       $('.comments', e).attr(
           'href', 'http://www.reddit.com/' + result.permalink);
       if (result.num_comments == 0) {
           $('.comments', e).html('comment');
       } else if (result.num_comments == 1) {
           $('.comments', e).html('1 comment');
       } else {
           $('.comments', e).html('' + result.num_comments + ' comments');
       }
       if (result.saved) {
           e.addClass('saved');
       }
       if ((i % 2) == 0) {
           e.addClass('even');
       } else {
           e.addClass('odd');
       }
       if (result.likes === true) {
           $('.up', e).addClass('upmod').removeClass('up');
       } else if (result.likes === false) {
           $('.down', e).addClass('downmod').removeClass('down');
       }
       e.appendTo($('#results')).show();
       $('#results').append('<div class="clearleft" />');
    }
}
