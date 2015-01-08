/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'views/base',
  'stache!templates/visits/item'
], function (BaseView, VisitsItemTemplate) {
  'use strict';

  var VisitsItemView = BaseView.extend({
    template: VisitsItemTemplate,

    events: {
      'click .destroy': 'destroyModel'
    },

    initialize: function () {
      this.listenTo(this.model, 'change', this.render);
    },

    destroyModel: function (event) {
      event.preventDefault();

      if (window.confirm('Destroy this visit?')) {
        this.model.destroy();
      }
    }
  });

  return VisitsItemView;
});
