$(document).ready(function() {
    $('#siteTable a.title').click(function() {
        chrome.extension.sendRequest(
            {'action': 'proactive-cache', 'uri': $(this).attr('href')});
    });
});
