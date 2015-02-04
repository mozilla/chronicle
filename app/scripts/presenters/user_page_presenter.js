/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'underscore',
  'lib/image_proxy'
], function (_, imageProxy) {
  'use strict';

  var MINIMUM_IMAGE_ENTROPY = 1.75;
  var IMAGE_DISPLAY_WIDTH = 270;
  var IMAGE_DISPLAY_HEIGHT = 180;

  // This pattern ignores extracted images from the following URLs
  // - anything from github (we'll likely have a long list of domains like this)
  // - any domain without a path
  // - search results
  // - anything paged
  var EXTRACTED_IMAGE_DENY_PATTERN = /github.com|(\..{2,3}\/$)|([&?]q=)|([&?]page=\d+)/;

  function UserPagePresenter (userPage, options) {
    // Copy over user page attributes
    _.extend(this, userPage.attributes);

    // Set default options
    options = _.extend({
      relatedVisit: null,
      alternateImages: true
    }, options);

    this.relatedVisit = options.relatedVisit && options.relatedVisit.attributes;
    this.alternateImages = options.alternateImages;
  }

  _.extend(UserPagePresenter.prototype, {
    title: function () {
      // Use the relatedVisit title if we have it
      return (this.relatedVisit && this.relatedVisit.title) || this.extractedTitle;
    },

    faviconUrl: function () {
      if (this.extractedFaviconUrl) {
        return imageProxy.display(this.extractedFaviconUrl);
      } else {
        return '/images/icon-favicon_default@2x.png';
      }
    },

    imageUrl: function () {
      var url = this.hasValidExtractedImageUrl() ? this.extractedImageUrl : this._getScreenshotUrl();

      // it would be smarter to only crop screenshots if we're not in retina, but it's easier
      // to let the imageProxy just handle it for now.
      return imageProxy.crop(url, IMAGE_DISPLAY_WIDTH, IMAGE_DISPLAY_HEIGHT);
    },

    imagePosition: function () {
      if (this.alternateImages) {
        return (this.title().length % 2) ? 'left' : 'right';
      } else {
        return 'right';
      }
    },

    isSearchResult: function () {
      return !!this._getUrl().match(/[?&#][pq]=/i);
    },

    hasHashBang: function () {
      return !!this._getUrl().match(/(#!)|(#(.*?)\/)/);
    },

    hasValidExtractedImageUrl: function () {
      return this.extractedImageUrl &&
             (this.extractedImageEntropy && this.extractedImageEntropy > MINIMUM_IMAGE_ENTROPY) &&
             !this._getUrl().match(EXTRACTED_IMAGE_DENY_PATTERN);
    },

    hasLargeImage: function () {
      return this.extractedImageWidth && this.extractedImageWidth >= IMAGE_DISPLAY_WIDTH;
    },

    getInterestingness: function () {
      if (!this.interestingness) {
        var value = 1.0;

        // Positives
        if (this.hasValidExtractedImageUrl()) {
          value *= 1.3;
        }

        if (this.hasLargeImage()) {
          value *= 1.2;
        }

        if (this.extractedMediaHtml) {
          value *= 2.0;
        }

        if (this.extractedDescription) {
          value *= 1.3;
        }

        // Negatives
        if (this.hasHashBang()) {
          value *= 0.6;
        }

        if (this.isSearchResult()) {
          value *= 0.2;
        }

        this.interestingness = value;
      }

      return this.interestingness;
    },

    isLarge: function () {
      return this.getInterestingness() >= 1.75;
    },

    isMedium: function () {
      return this.getInterestingness() < 1.75 && this.interestingness > 1.0;
    },

    isSmall: function () {
      return this.getInterestingness() <= 1.0;
    },

    getSizeClassName: function () {
      if (this.isLarge()) {
        return 'large';
      } else if (this.isMedium()) {
        return 'medium';
      } else {
        return 'small';
      }
    },

    // TODO: this is working around a difference in the location of the screenshot url (#264)
    _getScreenshotUrl: function () {
      return this.screenshot_url || (this.relatedVisit && this.relatedVisit.screenshot_url);
    },

    // TODO: this is working around a difference in the location of the url (#264)
    _getUrl: function () {
      return this.url || this.rawUrl;
    }
  });

  return UserPagePresenter;
});
