function reddited_get_canonical_uris() {
    var heads = document.getElementsByTagName('head')
    if (!heads.length) { return; }

    var uris = [];
    // prefer og:url over canonical since companies are
    // incentivized to keep it accurate
    var metas = heads[0].getElementsByTagName('meta');
    for (var i = 0; i < metas.length; i++) {
        var attrs = metas[i].attributes;
        if (attrs.property &&
            attrs.property.value.toLowerCase() == 'og:url' &&
            attrs.content &&
            attrs.content.value) {
            uris.push(attrs.content.value);
            break;
        }
    }

    var links = heads[0].getElementsByTagName('link');
    for (var i = 0; i < links.length; i++) {
        var attrs = links[i].attributes;
        if (attrs.rel &&
            attrs.rel.value.toLowerCase() == 'canonical' &&
            attrs.href &&
            attrs.href.value) {
            uris.push(attrs.href.value);
            break;
        }
    }

    return uris;
}

function reddited_do_content_changed() {
    chrome.extension.sendRequest({"action": "content-ready",
                                  "canonicals": reddited_get_canonical_uris()});
}

reddited_do_content_changed();
