function reddited_get_canonical_uri() {
    var heads = document.getElementsByTagName('head')
    if (!heads.length) { return; }

    // prefer og:url over canonical since companies are
    // incentivized to keep it accurate
    var metas = heads[0].getElementsByTagName('meta');
    for (var i = 0; i < metas.length; i++) {
        var attrs = metas[i].attributes;
        if (attrs.property &&
            attrs.property.value.toLowerCase() == 'og:url' &&
            attrs.content &&
            attrs.content.value) {
            return attrs.content.value;
        }
    }

    var links = heads[0].getElementsByTagName('link');
    for (var i = 0; i < links.length; i++) {
        var attrs = links[i].attributes;
        if (attrs.rel &&
            attrs.rel.value.toLowerCase() == 'canonical' &&
            attrs.href &&
            attrs.href.value) {
            return attrs.href.value;
        }
    }

    throw "no canonical uri";
}

function reddited_do_content_changed() {
    var canonical;
    try {
        canonical = reddited_get_canonical_uri();
    } catch (err) {
        // ignore
    }
    chrome.extension.sendRequest({"action": "content-ready",
                                  "canonical": canonical});
}

reddited_do_content_changed();
