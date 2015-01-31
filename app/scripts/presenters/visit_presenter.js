/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'underscore'
], function (_) {
  'use strict';

  var MINIMUM_IMAGE_ENTROPY = 1.75;
  var MINIMUM_IMAGE_WIDTH = 270;
  var EXTRACTED_IMAGE_DENY_PATTERN = /github.com|(\..{2,3}\/$)|([&?]q=)|([&?]page=\d+)/;

  function VisitPresenter (visit) {
    // flatten attributes
    _.extend(this, visit.attributes, visit.get('userPage'));
  }

  _.extend(VisitPresenter.prototype, {
    faviconUrl: function () {
      return this.extractedFaviconUrl || '/images/icon-favicon_default@2x.png';
    },

    isSearchResult: function () {
      return !!this.url.match(/[?&#][pq]=/i);
    },

    hasHashBang: function () {
      return !!this.url.match(/(#!)|(#(.*?)\/)/);
    },

    hasValidExtractedImageUrl: function () {
      return this.extractedImageUrl &&
             (this.extractedImageEntropy && this.extractedImageEntropy > MINIMUM_IMAGE_ENTROPY) &&
             !this.url.match(EXTRACTED_IMAGE_DENY_PATTERN);
    },

    hasLargeImage: function () {
      return this.extractedImageWidth && this.extractedImageWidth >= MINIMUM_IMAGE_WIDTH;
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
    }
  });

  return VisitPresenter;
});
