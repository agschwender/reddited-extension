console.log = function(msg) {
    chrome.extension.sendRequest({'action': 'log', 'value': msg});
};
$(document).ready(function() {
    var globals = chrome.extension.getBackgroundPage().globals;
    var finder = new Reddited.Finder(globals);

    finder.onRequesting = function() { $('#loader').show(); };
    finder.onRequestError = function(type) {
        $('#loader').hide();
        if (type == Reddited.Finder.REQUEST_ERROR_EMPTY) {
            return $('#results-none').show();
        } else if (type == Reddited.Finder.REQUEST_ERROR_REDDIT) {
            return $('#results-reddit').show();
        }
        return $('#results-error').show();
    };

    finder.onRequestSuccess = function(obj) {
        $('#loader').hide();
        if (!obj.count) {
            return $('#results-none').show();
        }

        var e = $('#results');
        $('.content', e).empty();
        $('.view-more', e).hide();
        e.show();
        for (var i = 0;
             i < Math.min(Reddited.MAX_RESULTS, obj.results.length);
             i++) {
            var r = obj.results[i].data;
            var t = $('#result-template .thing').clone();
            $(t).redditResult({'modhash': globals.modhash}, r)
                .appendTo($('.content', e));
            $('<div class="clearleft" />').appendTo($('.content', e));
        };

        if (obj.results.length > 5) {
            $('#view-more', e).show();
        }
    };

    chrome.tabs.getSelected(
        null,
        function(tab) {
            var url = tab.url;
            var canonical_urls = [];
            if (globals.pages[tab.id] &&
                globals.pages[tab.id].uri == tab.url) {
                url = globals.pages[tab.id].uri;
                canonical_urls = globals.pages[tab.id].canonical_uris;
            }
            finder.request_uri_details(url,
                                       {'canonical_uris': canonical_urls,
                                        'force': true,
                                        'require_results': true});
            var f = finder.onRequestSuccess;
            finder.onRequestSuccess = function(obj) {
                f(obj);
                chrome.extension.sendRequest({'action': 'set-badge',
                                              'count': obj.count,
                                              'tabId': tab.id});
            };
            $('.submit-uri').each(function() {
                var resubmit = $(this).attr('data-resubmit') === '1';
                $(this).attr(
                    'href', Reddited.get_reddit_submit_uri(tab.url, resubmit));
                $(this).click(function() { cache.remove(url); });
            });
            $('#view-more a').attr(
                'href',
                Reddited.get_reddit_view_more_uri(url, canonical_urls));

            $('#action-error a').click(function() {
                globals.cache.clear();
                return true;
            });

            $.ajaxPrefilter(function(opts, origopts, jqXHR) {
                if (opts.url.indexOf('reddit.com/api') >= 0) {
                    globals.cache.remove(url);
                }
            });
        }
    );
});
