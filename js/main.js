var Reddited = Reddited || {};

Reddited.MAX_RESULTS = 5;

Reddited.get_reddit_submit_uri = function(uri) {
    return 'http://www.reddit.com/submit?url=' + encodeURIComponent(uri);
};

Reddited.get_reddit_search_uri = function(uri) {
    return 'http://www.reddit.com/search.json'
        + '?q=' + encodeURIComponent('url:' + uri)
        + '&sort=relevance'
        + '&limit=' + (Reddited.MAX_RESULTS + 1)
        + '&src=reddited-extension';
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
        return base.substr(0, base.lastIndexOf(o.attr('relative'))) + relative;
    }

    var absolute = o.attr('directory');
    while (/^\.\./.test(relative)){
	absolute = absolute.substring(0, absolute.lastIndexOf('/'));
	relative = relative.substring(3);
    }
    return absolute;
};

Reddited.get_relative_time = function(t) {
    function get_num_and_units(t) {
        var n = new Date();
        if (t > n) {
            return [0, null];
        }

        var span = new TimePeriod(t, n);
        if (span.getYears() > 0) {
            return [span.getYears(), 'year'];
        } else if (span.getMonths() > 0) {
            return [span.getMonths(), 'month'];
        } else if (span.getDays() > 0) {
            return [span.getDays(), 'day'];
        } else if (span.getHours() > 0) {
            return [span.getHours(), 'hour'];
        } else if (span.getMinutes() > 0) {
            return [span.getMinutes(), 'minute'];
        } else if (span.getSeconds() > 0) {
            return [span.getSeconds(), 'second'];
        } else if (span.getMilliseconds() > 0) {
            return [span.getMilliseconds(), 'millisecond'];
        }

        return [0, null];
    }

    var a = get_num_and_units(t);
    if (a[0] == 0) {
        return '0 milliseconds';
    } else if (a[0] == 1) {
        return '' + a[0] + ' ' + a[1];
    }

    return '' + a[0] + ' ' + a[1] + 's';
};

Reddited.Page = function(uri, meta) {
    this.uri = uri;
    this.canonical_uri = $.trim(meta.canonical_uri || '');
};

Reddited.Page.prototype._is_shortened_uri = function(shortened, full) {
    var m = $.url(shortened);
    var n = $.url(full);
    if (m.attr('host') != n.attr('host')) {
        return false;
    } else if (m.attr('path') != n.attr('path')) {
        return false;
    } else if (m.attr('query') &&
               n.attr('query').indexOf(m.attr('query')) != 0) {
        return false;
    }

    return true;
};

Reddited.Page.prototype.get_preferred_uri = function() {
    if (!this.canonical_uri) { return this.uri; }
    var preferred_uri = Reddited.relative_uri_to_absolute(
        this.canonical_uri, this.uri);
    if (!this._is_shortened_uri(preferred_uri, this.uri)) {
        return this.uri;
    }
    return preferred_uri;
};

Reddited.Cache = function() {
    this._cache = {};
    setInterval($.proxy(this.purge_stale, this),
                Reddited.Cache.PURGE_FREQUENCY);
};

Reddited.Cache.DEFAULT_TTL = 300000; // 5 * 60 * 1000
Reddited.Cache.PURGE_FREQUENCY = 60000; // 60 * 1000

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

Reddited.Cache.prototype.clear = function() {
    for (var k in this._cache) {
        delete this._cache[k];
    }
    return this;
}


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
    'blog.reddit.com',
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


Reddited.Finder = function(globals) {
    this._globals = globals;
    this._globals.cache = this._globals.cache || new Reddited.Cache();
    this._storage = new Reddited.Storage();
};

Reddited.Finder.REQUEST_ERROR_EMPTY = 'empty';
Reddited.Finder.REQUEST_ERROR_REDDIT = 'reddit';
Reddited.Finder.REQUEST_ERROR_BAD_RESPONSE = 'bad';

Reddited.Finder.prototype._parse_response = function(o) {
    if (!o) {
        throw 'empty response';
    }

    o.kind = o.kind || '';
    if (o.kind.toLowerCase() != 'listing' || !o.data) {
        throw 'invalid response';
    }

    o.data.children = o.data.children || [];
    return {'modhash': o.data.modhash,
            'count': o.data.children.length,
            'results': o.data.children};
};

Reddited.Finder.prototype._handle_response = function(uri, response, xhr) {
    if (!xhr.status || xhr.status >= 400) {
        return this.onRequestError(Reddited.Finder.REQUEST_ERROR_BAD_RESPONSE);
    }
    var obj;
    try {
        obj = this._parse_response(response);
    } catch (err) {
        console.log(err);
        return this.onRequestError(Reddited.Finder.REQUEST_ERROR_BAD_RESPONSE);
    }
    var modhash = obj.modhash;
    if ((!this._globals['modhash'] || !modhash) &&
        (this._globals['modhash'] || modhash)) {
        this._globals.cache.clear();
    }
    delete obj.modhash;
    this._globals.modhash = modhash;
    this._globals.cache.set(uri, obj);
    this.onRequestSuccess(obj);
};

Reddited.Finder.prototype.request_uri_details = function(uri, opts) {
    opts = opts || {}
    if (!uri) {
        return this.onRequestError(Reddited.Finder.REQUEST_ERROR_EMPTY);
    } else if (uri.indexOf('http://www.reddit.com/r/') == 0) {
        return this.onRequestError(Reddited.Finder.REQUEST_ERROR_REDDIT);
    }

    if (!opts.force && !this.should_auto_check(uri)) {
        return this.onRequestIgnored();
    }

    var obj = this._globals.cache.get(uri);
    if (obj && !(opts.require_results && obj.count_only)) {
        console.log('reddited: using cache');
        return this.onRequestSuccess(obj);
    }

    console.log('reddited: making request');
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

(function($) {
    $.fn.redditVotable = function(modhash) {
        $(this).click(function() {
            if ($(this).hasClass('down')) {
                $(this)._redditVotedown(modhash);
            } else {
                $(this)._redditVoteup(modhash);
            }
            return false;
        });
        var e = $(this).closest('.thing');
        $(this).each(function() {
            if ($(this).hasClass('up') && $(e).data('likes') === true) {
                $(this).addClass('mod');
            } else if ($(this).hasClass('down') &&
                       $(e).data('likes') === false) {
                $(this).addClass('mod');
            }
        });
    };

    $.fn._redditVoteup = function(modhash) {
        var e = $(this).closest('.thing');
        var dir = 1, inc = 1;
        if ($(e).data('likes') === true) {
            dir = 0, inc = -1;
        } else if ($(e).data('likes') === false) {
            inc = 2;
        }
        return $(this)._redditVote(modhash, dir, inc);
    };

    $.fn._redditVotedown = function(modhash) {
        var e = $(this).closest('.thing');
        var dir = -1, inc = -1;
        if ($(e).data('likes') === true) {
            inc = -2;
        } else if ($(e).data('likes') === false) {
            dir = 0, inc = 1;
        }
        return $(this)._redditVote(modhash, dir, inc);
    };

    $.fn._redditVote = function(modhash, dir, inc) {
        if (!modhash) {
            $('#action-error').show();
            return false;
        }
        var e = $(this).closest('.thing');
        $.ajax({'url': 'http://www.reddit.com/api/vote',
                'type': 'POST',
                'data': {'id': $(e).data('name'), 'dir': dir, 'uh': modhash}});
        $('.arrow.up, .arrow.down', e).removeClass('mod');
        if (dir == 1 ) {
            $('.arrow.up', e).addClass('mod');
            $(e).data('likes', true);
        } else if (dir == -1) {
            $('.arrow.down', e).addClass('mod');
            $(e).data('likes', false);
        } else {
            $(e).data('likes', null);
        }
        $('.score.unvoted', e).text(
            Math.max(0, inc + parseInt($('.score.unvoted', e).text())));
    };
})(jQuery);

(function($) {
    $.fn.redditSavable  = function(modhash) {
        var e = $(this).closest('.thing');
        $(this).text($(e).data('saved') ? 'unsave' : 'save');
        $(this).click(function() {
            if (!modhash) {
                $('#action-error').show();
                return false;
            }
            var endpoint = 'save', text = 'saved';
            if ($(e).data('saved')) {
                endpoint = 'unsave', text = 'unsaved';
            }
            $.ajax({'url': 'http://www.reddit.com/api/' + endpoint,
                    'type': 'POST',
                    'data': {'id': $(e).data('name'), 'uh': modhash}});
            $(this).parent().text(text);
            $(e).data('saved', !$(e).data('saved'));
            return false;
        });
    };
})(jQuery);

(function($) {
    $.fn.redditResult = function(opts, r) {
        return $(this).each(function() { $.redditResult(opts, r, this); });
    };

    $.redditResult = function(opts, r, e) {
        $(e).data(r);
        $('.arrow', e).redditVotable(opts.modhash);
        $('.savable', e).redditSavable(opts.modhash);
        $('.score.dislikes', e).text(r.downs);
        $('.score.unvoted', e).text(r.score);
        $('.score.likes', e).text(r.ups);
        $('a.title, a.thumbnail', e)
            .attr('href', $('<textarea/>').html(r.url).val());
        if (r.thumbnail) {
            $('.thumbnail img', e)
                .attr('src',
                      Reddited.relative_uri_to_absolute(
                          r.thumbnail, 'http://www.reddit.com/'));
        } else {
            $('.thumbnail', e).hide();
        }
        $('a.title', e).text(r.title);
        $('.domain a', e)
            .attr(
                'href',
                'http://www.reddit.com/domain/'
                    + encodeURIComponent(r.domain)
                    + '/')
            .text(r.domain);
        $('.author', e)
            .attr('href',
                  'http://www.reddit.com/user/'
                  + encodeURIComponent(r.author))
            .text(r.author);
        $('.subreddit', e)
            .attr('href',
                  'http://www.reddit.com/r/'
                  + encodeURIComponent(r.subreddit)
                  + '/')
            .text(r.subreddit);
        $('.tagline time', e)
            .text(Reddited.get_relative_time(new Date(r.created_utc * 1000)));
        $('.comments', e)
            .attr('href', 'http://www.reddit.com/' + r.permalink)
            .text(r.num_comments == 0
                  ? 'comment'
                  : (r.num_comments == 1
                     ? '1 comment'
                     : '' + r.num_comments + ' comments'));
        if (r.over_18) {
            $('.nsfw-stamp', e).show();
        }
        return $;
    };
})(jQuery);

(function(h,f){var i={a:"href",img:"src",form:"action",base:"href",script:"src",iframe:"src",link:"href"},j=["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","fragment"],e={anchor:"fragment"},a={strict:/^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,loose:/^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/},c=/(?:^|&|;)([^&=;]*)=?([^&;]*)/g,b=/(?:^|&|;)([^&=;]*)=?([^&;]*)/g;function g(k,n){var p=decodeURI(k),m=a[n||false?"strict":"loose"].exec(p),o={attr:{},param:{},seg:{}},l=14;while(l--){o.attr[j[l]]=m[l]||""}o.param.query={};o.param.fragment={};o.attr.query.replace(c,function(r,q,s){if(q){o.param.query[q]=s}});o.attr.fragment.replace(b,function(r,q,s){if(q){o.param.fragment[q]=s}});o.seg.path=o.attr.path.replace(/^\/+|\/+$/g,"").split("/");o.seg.fragment=o.attr.fragment.replace(/^\/+|\/+$/g,"").split("/");o.attr.base=o.attr.host?o.attr.protocol+"://"+o.attr.host+(o.attr.port?":"+o.attr.port:""):"";return o}function d(l){var k=l.tagName;if(k!==f){return i[k.toLowerCase()]}return k}h.fn.url=function(l){var k="";if(this.length){k=h(this).attr(d(this[0]))||""}return h.url(k,l)};h.url=function(k,l){if(arguments.length===1&&k===true){l=true;k=f}l=l||false;k=k||window.location.toString();return{data:g(k,l),attr:function(m){m=e[m]||m;return m!==f?this.data.attr[m]:this.data.attr},param:function(m){return m!==f?this.data.param.query[m]:this.data.param.query},fparam:function(m){return m!==f?this.data.param.fragment[m]:this.data.param.fragment},segment:function(m){if(m===f){return this.data.seg.path}else{m=m<0?this.data.seg.path.length+m:m-1;return this.data.seg.path[m]}},fsegment:function(m){if(m===f){return this.data.seg.fragment}else{m=m<0?this.data.seg.fragment.length+m:m-1;return this.data.seg.fragment[m]}}}}})(jQuery);
