$.ajaxPrefilter(function(opts, origopts, jqXHR) {
    if (opts.url.indexOf('/') == 0) {
        opts.url = 'http://www.reddit.com' + opts.url;
    } else if (opts.url.indexOf('://') == -1) {
        opts.url = 'http://www.reddit.com/' + opts.url;
    }
});

function getRedditSubmitURI(uri) {
    return 'http://www.reddit.com/submit?url=' + encodeURIComponent(uri);
}

function sendRedditSearch(uri) {
    chrome.extension.sendRequest({"action": "log", "value": "hello"});
    if (!uri) {
        $('#loader').hide();
        $('#results-none').show();
        return;
    }
    chrome.extension.sendRequest(
        {"action": "get", "url": getRedditSubmitURI(uri)}, parseRedditResponse);
}

function parseRedditResponse(response) {
    $('#loader').hide();
    if (!response.status || response.status >= 400) {
        return $('#results-error').show();
    }
    if (!response.content) { return $('#results-none').show(); }
    var siteTable = $('#siteTable', response.content);
    var results = $(siteTable).children('.thing');
    if (results.length == 0) {
        return $('#results-none').show();
    }

    var regexp = /<script[^>]+>(\s*(var )?reddit([ =\.]).*?)<\/script>/g;
    var match;
    while (match = regexp.exec(response.content)) {
        $('body').append(
            '<script type="text/javascript">' + match[1] + '</script>');
    }

    // include reddit.js after reddit config values have been initialized
    $('body').append(
        '<script type="text/javascript" src="js/reddit.js"></script>');

    $('#results').empty().show();
    for (var i = 0; i < Math.min(5, results.length); i++) {
        $('a', results[i]).attr('target', '_new');
        $('a.title, a.thumbnail', results[i]).attr(
            'href', $('a.comments', results[i]).attr('href'));
        $('img', results[i]).each(function() {
            if ($(this).attr('src') &&
                $(this).attr('src').indexOf('://') == -1) {
                $(this).attr(
                    'src', 'http://www.reddit.com' + $(this).attr('src'));
            }
        });
        $(results[i]).appendTo($('#results'));
        $('#results').append('<div class="clearleft" />');
    }
}
