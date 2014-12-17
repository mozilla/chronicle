/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(
  [
    'underscore',
    'backbone',
    'lib/localizer'
  ],
  function (_, Backbone, Localizer) {
    'use strict';

    /**
    * Base class for views that provides common rendering, model presentation, DOM assignment,
    * subview tracking, and tear-down.
    *
    * @class BaseView
    *
    * @constructor
    *
    * @param {Object} options configuration options passed along to Backbone.View
    */
    var BaseView = Backbone.View.extend({
      constructor: function (options) {
        this.subviews = [];

        Backbone.View.call(this, options);
      },

      /**
      * Gets context from model's attributes. Can be overridden to provide custom context for template.
      *
      * @method getContext
      * @return {Object} context
      */
      getContext: function () {
        var context;

        if (this.model) {
          context = this.model.attributes;
        } else {
          context = {};
        }

        return context;
      },

      /**
      * Localizes English input text.
      *
      * @method localize
      * @return {String} localized text
      */
      localize: function (text) {
        return Localizer.localize(text);
      },

      /**
      * Renders by combining template and context and inserting into the associated element.
      *
      * @method render
      * @return {BaseView} this
      * @chainable
      */
      render: function () {
        this.destroySubviews();

        var context = this.getContext();
        var self = this;

        context.l = function () {
          return function (text, render) {
            return render(self.localize(text));
          };
        };

        this.$el.html(this.template(context));

        this.afterRender();

        return this;
      },

      /**
      * Called after render completes. Provides easy access to custom rendering for subclasses
      * without having to override render.
      *
      * @method afterRender
      */
      afterRender: function () {
        // Implement in subclasses
      },

      /**
      * Renders local collection using the provided view and inserts into the provided selector.
      *
      * @method renderCollection
      * @param {Backbone.View} ItemView view for rendering each item in the collection
      * @param {String} selector jQuery selector to insert the collected elements
      */
      renderCollection: function (ItemView, selector) {
        var els = this.collection.collect(function (item) {
          return this.trackSubview(new ItemView({ model: item })).render().el;
        }.bind(this));

        this.$(selector).append(els);
      },

      /**
      * Assigns view to a selector.
      *
      * @method assign
      * @param {Backbone.View} view to assign
      * @param {String} selector jQuery selector for the element to be assigned
      * @return {BaseView} this
      */
      assign: function (view, selector) {
        view.setElement(this.$(selector));
        view.render();
      },

      /**
      * Destroys view by stopping Backbone event listeners, disabling jQuery events, and destroying
      * subviews.
      *
      * @method destroy
      */
      destroy: function () {
        if (this.beforeDestroy) {
          this.beforeDestroy();
        }

        this.stopListening();
        this.destroySubviews();
        this.$el.off();
      },

      /**
      * Keeps track of a subview so that it can later be destroyed.
      *
      * @method trackSubview
      * @param {BaseView} view to track
      * @return {BaseView} tracked view
      */
      trackSubview: function (view) {
        if (!_.contains(this.subviews, view)) {
          this.subviews.push(view);
        }

        return view;
      },

      /**
      * Destroys all subviews.
      *
      * @method destroySubviews
      */
      destroySubviews: function () {
        _.invoke(this.subviews, 'destroy');

        this.subviews = [];
      }
    });

    return BaseView;
  }
);
