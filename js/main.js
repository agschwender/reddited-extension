var Reddited = Reddited || {};

Reddited.get_reddit_submit_uri = function(uri) {
    return 'http://www.reddit.com/submit?url=' + encodeURIComponent(uri);
};

Reddited.get_reddit_search_uri = function(uri) {
    // TODO: replace with json web service
    return 'http://www.reddit.com/search?q=' + encodeURIComponent('url:' + uri);
};

Reddited.relative_uri_to_absolute = function(relative, base) {
    if (!$.trim(relative)) {
        return base;
    }

    var o = $.url(relative);
    if (o.attr('protocol')) {
        return relative;
    }

    o = $.url(base);
    if (relative.indexOf('/') == 0) {
        return base.substr(0, base.indexOf(o.attr('path'))) + relative;
    }

    var absolute = o.attr('directory');
    while (/^\.\./.test(relative)){
	absolute = absolute.substring(0, absolute.lastIndexOf('/'));
	relative = relative.substring(3);
    }
    return absolute;
};

Reddited.Cache = function() {
    this._cache = {};
    setInterval($.proxy(this.purge_stale, this),
                Reddited.Cache.PURGE_FREQUENCY);
};

Reddited.Cache.DEFAULT_TTL = 1800000; // 30 * 60 * 1000
Reddited.Cache.PURGE_FREQUENCY = 300000; // 5 * 60 * 1000

Reddited.Cache.prototype.set = function(key, value, ttl) {
    var now = new Date();
    var expiry = new Date(now.getTime() + (ttl || Reddited.Cache.DEFAULT_TTL));
    this._cache[key] = {'expiry': expiry, 'value': value};
    return this;
};

Reddited.Cache.prototype.get = function(key) {
    var obj = this._cache[key] || {}
    var now = new Date();
    if ((obj.expiry || now) < now) { return false; }
    return obj.value || false;
};

Reddited.Cache.prototype.remove = function(key) {
    if (this._cache[key]) {
        delete this._cache[key];
    }
    return this;
};

Reddited.Cache.prototype.purge_stale = function() {
    var now = new Date();
    for (var k in this._cache) {
        if (this._cache[k].expiry < now) {
            delete this._cache[k];
        }
    }
    return this;
};


Reddited.Storage = function() {
    var o;
    try {
        o = $.parseJSON(localStorage[Reddited.Storage.STORAGE_KEY]) || {};
    } catch (err) {
        o = {};
        console.log('reddited: error reading local storage');
        console.log(JSON.stringify(err));
    }
    this.set_auto_check(o.auto_check);
    this.set_auto_check_whitelist(o.auto_check_whitelist);
    this.set_auto_check_whitelist_customized(o.auto_check_whitelist_customized);
    this.set_auto_check_https(o.auto_check_https);
    this._local_state = this._current_state();
    $(document).trigger('reddited-storage-loaded', [this]);
};

Reddited.Storage.STORAGE_KEY = 'reddited_options';
Reddited.Storage.OPTIONS_AUTO_CHECK = ['never', 'whitelist', 'always'];
Reddited.Storage.DEFAULT_AUTO_CHECK = 'whitelist';
Reddited.Storage.DEFAULT_AUTO_CHECK_WHITELIST =  [
    'bbc.co.uk',
    'blogspot.com',
    'boingboing.net',
    'cnn.com',
    'flickr.com',
    'forbes.com',
    'foxnews.com',
    'guardian.co.uk',
    'imgur.com',
    'latimes.com',
    'msnbc.msn.com',
    'news.yahoo.com',
    'nytimes.com',
    's3.amazonaws.com',
    'tumblr.com',
    'wikipedia.org',
    'wordpress.com',
    'wsj.com',
    'xkcd.com',
    'vimeo.com',
    'youtube.com'
    ];

Reddited.Storage.prototype._current_state = function() {
    var obj = {
        'auto_check': this.get_auto_check(),
        'auto_check_whitelist': this.get_auto_check_whitelist(),
        'auto_check_whitelist_customized': this.get_auto_check_whitelist_customized(),
        'auto_check_https': this.get_auto_check_https()
    };
    return JSON.stringify(obj);
};

Reddited.Storage.prototype.set_auto_check = function(v) {
    if ($.inArray(v, Reddited.Storage.OPTIONS_AUTO_CHECK) < 0) {
        v = Reddited.Storage.DEFAULT_AUTO_CHECK;
    }
    this._auto_check = v;
    return this;
};

Reddited.Storage.prototype.get_auto_check = function() {
    return this._auto_check;
};

Reddited.Storage.prototype.set_auto_check_whitelist = function(v) {
    if (!$.isArray(v)) {
        v = $.trim(v || '');
        if (v) {
            v = v.split("\n");
        } else {
            v = [];
        }
    }
    for (var i = 0; i < Math.min(200, v.length); i++) {
        v[i] = $.trim(v[i]).toLowerCase();
    }
    v.sort();
    this._auto_check_whitelist = v;
    return this;
};

Reddited.Storage.prototype.get_auto_check_whitelist = function(required) {
    if (!this._auto_check_whitelist_customized) {
        return Reddited.Storage.DEFAULT_AUTO_CHECK_WHITELIST;
    }
    if (required && this._auto_check_whitelist == false) {
        return Reddited.Storage.DEFAULT_AUTO_CHECK_WHITELIST;
    }
    return this._auto_check_whitelist;
};

Reddited.Storage.prototype.set_auto_check_whitelist_customized = function(v) {
    this._auto_check_whitelist_customized = !!v;
    return this;
};

Reddited.Storage.prototype.get_auto_check_whitelist_customized = function() {
    return this._auto_check_whitelist_customized;
};

Reddited.Storage.prototype.set_auto_check_https = function(v) {
    this._auto_check_https = !!v;
    return this;
};

Reddited.Storage.prototype.get_auto_check_https = function() {
    return this._auto_check_https;
};

Reddited.Storage.prototype.save = function(force) {
    var state = this._current_state();
    if (!force && this._local_state == state) {
        return this;
    }
    localStorage[Reddited.Storage.STORAGE_KEY] = state;
    this._local_state = state;
    $(document).trigger('reddited-storage-saved', [this]);
    return this;
}


Reddited.Finder = function(cache) {
    this._cache = cache || new Reddited.Cache();
    this._storage = new Reddited.Storage();
};

Reddited.Finder.REQUEST_ERROR_EMPTY = 'empty';
Reddited.Finder.REQUEST_ERROR_REDDIT = 'reddit';
Reddited.Finder.REQUEST_ERROR_BAD_RESPONSE = 'bad';

Reddited.Finder.prototype._parse_response = function(response) {
    if (!response) {
        return {'num_results': 0, 'source': null};
    }

    // TODO: replace with json web service
    var siteTable = $('#siteTable', response);
    var results = $(siteTable).children('.thing');
    if (results.length == 0) {
        return {'num_results': 0, 'source': null};
    }

    return {'num_results': results.length, 'source': response};
};

Reddited.Finder.prototype._handle_response = function(uri, response, xhr) {
    if (!xhr.status || xhr.status >= 400) {
        return this.onRequestError(Reddited.Finder.REQUEST_ERROR_BAD_RESPONSE);
    }
    var obj = this._parse_response(response);
    this._cache.set(uri, obj);
    this.onRequestSuccess(obj);
};

Reddited.Finder.prototype.request_uri_details = function(uri, force) {
    if (!uri) {
        return this.onRequestError(Reddited.Finder.REQUEST_ERROR_EMPTY);
    } else if (uri.indexOf('http://www.reddit.com/r/') == 0) {
        return this.onRequestError(Reddited.Finder.REQUEST_ERROR_REDDIT);
    }

    if (!force && !this.should_auto_check(uri)) {
        return this.onRequestIgnored();
    }

    var obj = this._cache.get(uri);
    if (obj) {
        chrome.extension.sendRequest(
            {"action": "log", "value": "reddited: using cache"});
        return this.onRequestSuccess(obj);
    }

    chrome.extension.sendRequest(
        {"action": "log", "value": "reddited: making request"});
    this.onRequesting();
    var f = $.proxy(this._handle_response, this);
    $.ajax(Reddited.get_reddit_search_uri(uri.replace(/\#.*$/, '')),
           {'cache': true,
            'success': function(data, ts, jqXHR) { f(uri, data, jqXHR); },
            'error': function(jqXHR) { f(uri, null, jqXHR); }});
};

Reddited.Finder.prototype.should_auto_check = function(uri) {
    var o = $.url(uri);
    var host = o.attr('host');
    var protocol = o.attr('protocol');

    if (this._storage.get_auto_check() == 'never') {
        return false;
    } else if (this._storage.get_auto_check() == 'always') {
        if (protocol == 'https' && !this._storage.get_auto_check_https()) {
            return false;
        }
        return true;
    } else if (protocol == 'https') {
        return false;
    }

    var whitelist = this._storage.get_auto_check_whitelist(true);
    for (var i = 0; i < whitelist.length; i++) {
        if (whitelist[i].length > host.length) {
            continue;
        } else if (host.substr(-1 * whitelist[i].length) == whitelist[i]) {
            return true;
        }
    }
    return false;
};

Reddited.Finder.prototype.onRequesting = function() {};
Reddited.Finder.prototype.onRequestIgnored = function(type) {};
Reddited.Finder.prototype.onRequestError = function(type) {};
Reddited.Finder.prototype.onRequestSuccess = function(obj) {};

// jQuery plugins

(function(h,f){var i={a:"href",img:"src",form:"action",base:"href",script:"src",iframe:"src",link:"href"},j=["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","fragment"],e={anchor:"fragment"},a={strict:/^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,loose:/^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/},c=/(?:^|&|;)([^&=;]*)=?([^&;]*)/g,b=/(?:^|&|;)([^&=;]*)=?([^&;]*)/g;function g(k,n){var p=decodeURI(k),m=a[n||false?"strict":"loose"].exec(p),o={attr:{},param:{},seg:{}},l=14;while(l--){o.attr[j[l]]=m[l]||""}o.param.query={};o.param.fragment={};o.attr.query.replace(c,function(r,q,s){if(q){o.param.query[q]=s}});o.attr.fragment.replace(b,function(r,q,s){if(q){o.param.fragment[q]=s}});o.seg.path=o.attr.path.replace(/^\/+|\/+$/g,"").split("/");o.seg.fragment=o.attr.fragment.replace(/^\/+|\/+$/g,"").split("/");o.attr.base=o.attr.host?o.attr.protocol+"://"+o.attr.host+(o.attr.port?":"+o.attr.port:""):"";return o}function d(l){var k=l.tagName;if(k!==f){return i[k.toLowerCase()]}return k}h.fn.url=function(l){var k="";if(this.length){k=h(this).attr(d(this[0]))||""}return h.url(k,l)};h.url=function(k,l){if(arguments.length===1&&k===true){l=true;k=f}l=l||false;k=k||window.location.toString();return{data:g(k,l),attr:function(m){m=e[m]||m;return m!==f?this.data.attr[m]:this.data.attr},param:function(m){return m!==f?this.data.param.query[m]:this.data.param.query},fparam:function(m){return m!==f?this.data.param.fragment[m]:this.data.param.fragment},segment:function(m){if(m===f){return this.data.seg.path}else{m=m<0?this.data.seg.path.length+m:m-1;return this.data.seg.path[m]}},fsegment:function(m){if(m===f){return this.data.seg.fragment}else{m=m<0?this.data.seg.fragment.length+m:m-1;return this.data.seg.fragment[m]}}}}})(jQuery);
