/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'underscore',
  'views/base',
  'stache!templates/visits/item',
  'presenters/visit_presenter'
], function (_, BaseView, VisitsItemTemplate, VisitPresenter) {
  'use strict';

  var VisitsItemView = BaseView.extend({
    className: 'visit',
    template: VisitsItemTemplate,

    events: {
      'click .destroy': 'destroyModel'
    },

    initialize: function () {
      this.presenter = new VisitPresenter(this.model);

      this.listenTo(this.model, 'change', this.render);
    },

    getContext: function () {
      return this.presenter;
    },

    afterRender: function () {
      // add size class
      this.$el.addClass(this.presenter.getSizeClassName());
      // add image position class
      this.$el.find('.image').addClass(_.sample(['left', 'right']));
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
