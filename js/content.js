function reddited_get_canonical_uris() {
    var heads = document.getElementsByTagName('head');
    if (!heads.length) { return []; }

    var uris = [], attrs, i;

    var metas = heads[0].getElementsByTagName('meta');
    for (i = 0; i < metas.length; i++) {
        attrs = metas[i].attributes;
        if (attrs.property &&
            attrs.property.value.toLowerCase() == 'og:url' &&
            attrs.content &&
            attrs.content.value) {
            uris.push(attrs.content.value);
            break;
        }
    }

    var links = heads[0].getElementsByTagName('link');
    for (i = 0; i < links.length; i++) {
        attrs = links[i].attributes;
        if (attrs.rel &&
            (attrs.rel.value.toLowerCase() == 'canonical' ||
             (attrs.rel.value.toLowerCase() == 'alternate' &&
              attrs.media &&
              attrs.media.value.toLowerCase() == 'handheld') ||
             attrs.rel.value.toLowerCase() == 'shortlink') &&
            attrs.href &&
            attrs.href.value) {
            uris.push(attrs.href.value);
        }
    }

    return uris;
}

function reddited_do_content_changed() {
    chrome.extension.sendRequest({"action": "content-ready",
                                  "canonicals": reddited_get_canonical_uris()});
}

reddited_do_content_changed();
