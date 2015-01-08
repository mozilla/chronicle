/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'views/base',
  'stache!templates/visits/index',
  'collections/visits',
  'views/visits/item'
], function (BaseView, VisitsIndexTemplate, Visits, VisitsItemView) {
  'use strict';

  var VisitsIndexView = BaseView.extend({
    template: VisitsIndexTemplate,

    initialize: function () {
      this.collection = new Visits();

      this.listenTo(this.collection, 'add destroy reset', this.render);

      // Fetch visits from the server
      this.collection.fetch({ reset: true });
    },

    afterRender: function () {
      this.renderCollection(VisitsItemView, '.visits');
    }
  });

  return VisitsIndexView;
});
