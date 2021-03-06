var globals = {'modhash': null,
               'cache': new Reddited.Cache(),
               'pages': {}};

function on_tab_changed(tab) {
    if (tab.url.indexOf('http://') == 0 || tab.url.indexOf('https://') == 0) {
        chrome.tabs.executeScript(tab.id, {'file': 'js/content.js'});
    } else {
        on_tab_ready(tab);
    }
};

function on_tab_ready(tab) {
    var finder = new Reddited.Finder(globals);
    finder.onRequestSuccess = function(obj) {
        set_badge(tab, obj.count);
    };
    var url = tab.url;
    var canonical_urls = [];
    if (globals.pages[tab.id] && globals.pages[tab.id].uri == tab.url) {
        url = globals.pages[tab.id].uri;
        canonical_urls = globals.pages[tab.id].canonical_uris;
    }
    finder.request_uri_details(url, {'canonical_uris': canonical_urls});
};

function set_badge(tab, count) {
    var color = [0, 230, 0, 255];
    var text = '' + count;
    if (count == 0) {
        color = [51, 102, 153, 255];
    } else if (count > 5) {
        text = '5+';
    }
    chrome.browserAction.setBadgeBackgroundColor(
        {'color': color, 'tabId': tab.id});
    chrome.browserAction.setBadgeText({'text': text, 'tabId': tab.id});
};

chrome.tabs.onUpdated.addListener(function(id, info, tab) {
    if (info.status == 'loading') { on_tab_changed(tab); }
});

chrome.tabs.onSelectionChanged.addListener(function() {
    chrome.tabs.getSelected(null, function(tab) { on_tab_changed(tab); });
});

chrome.tabs.onRemoved.addListener(function(id, info) {
    if (globals.pages[id]) { delete globals.pages[id]; }
});

chrome.extension.onRequest.addListener(function(request, sender, callback) {
    if (request.action == 'log') {
        console.log(request.value);
    } else if (request.action == 'content-ready') {
        globals.pages[sender.tab.id] = new Reddited.Page(
            sender.tab.url, {'canonical_uris': request.canonicals});
        on_tab_ready(sender.tab);
    } else if (request.action == 'proactive-cache') {
        if (!globals.cache.get(request.uri)) {
            globals.cache.set(request.uri, {'count': 1, 'count_only': true});
        }
    } else if (request.action == 'set-badge') {
        chrome.tabs.get(request.tabId, function(tab) {
            set_badge(tab, request.count);
        });
    }
    callback({});

});
