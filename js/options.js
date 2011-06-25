var Reddited = Reddited || {};

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
    if (this._auto_check == 'whitelist' && !this._auto_check_whitelist) {
        return 'never';
    }
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

Reddited.Storage.prototype.get_auto_check_whitelist = function() {
    if (!this._auto_check_whitelist_customized) {
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
