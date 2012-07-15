Reddit Anywhere Browser Extension
==========================

The Reddit Anywhere extension (formerly Reddited) allows you to check if the page you are viewing has been submitted to Reddit. It works on all URLs: web pages, videos, images, etc... So now you can finally get the inscrutable imgur jokes your friends send you. It allows you to quickly up or down vote the page or go directly to the page's comments without having to search on Reddit. And if the page you are viewing hasn't been submitted to Reddit, the extension provides a convenient link for submitting the page yourself.

### Instructions

Click the Reddit Anywhere extension button on any page and the extension will search for that URL on Reddit. If it finds submissions, it will list the 5 most relevant submissions. If it does not find submissions, it will provide you with a post link.

### Main Features

*  Will automatically indicate if the page has been submitted to Reddit
*  Allows voting directly from the page
*  Uses Reddit layout
*  Allows you to manage the auto-indication privacy settings
*  Uses the canonical URL to avoid submitting duplicate pages

### Details

By default, the extension will automatically check if the page you are viewing has been submitted to Reddit for a small set of common domains. This can be expanded to all domains, no domains or a specific set of your choosing through the options page. This allows full control over which pages are sent to Reddit and protects your privacy. If automatic checking is enabled, the Reddit Anywhere extension button will indicate the number of times the page has been submitted to Reddit.

While there are comparable extensions, the Reddit Anywhere extension was designed to be less obtrusive. It will only send those pages you are viewing to Reddit when they reside on domains that you are comfortable sending or when you explicitly click the extension button, maintaining your privacy. It relies on chrome's popup layer rather than manipulating the page itself, maintaining the page's original content. It will prefer the canonical URL over the tab URL, avoiding missing content for sites which add arbitrary query parameters (I'm looking at you, New York Times). It also uses reddit's exact layout giving it a familiar user interface.

### Changelog

*  v1.3.1 - v1.3.15
  *  Changed for manifest v2 and new security requirements
  *  Fixed default image thumbnails
  *  Updated search API call to reflects changes in Reddit API
  *  Fixed encoding issue
  *  Permission changes for allowing the identification of canonical URLs on secure pages
  *  Fixed issue with relative canonical URLs not being transformed to absolute URLs
  *  Canonical URLs are appended to search string using the OR operator rather than as a replacement to the browser URL
  *  Fixed whitelist domain editing on the options page
  *  Fixed for URLs that rely on #!, e.g. twitter
  *  Fixed issue where view more link not displayed
  *  Fixed comment link padding issue

  *  Added NSFW indicator
  *  Added blog.reddit.com to the list of domains which are automatically checked
  *  Fixed proactive caching error
  *  Fixed HTML encoding error

*  v1.3.0
  *  Renamed extension from Reddited to Reddit Anywhere
  *  Integrated Reddit API for search, vote and save
  *  Use the canonical URL only when it is a substring of the actual URL
