/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'underscore',
  'jquery',
  'velocity',
  'velocityui'
], function (_, $) {
  'use strict';

  function ModalManager () {
    this._viewStates = [];
    this.$modal = $('#modal');

    // Handle default button actions
    this.$modal.on('click', 'a.close', this.close.bind(this));
    this.$modal.on('click', 'a.back', this.pop.bind(this));
  }

  _.extend(ModalManager.prototype, {
    /**
    * Opens the modal. This is a specialized version of `push` that cleans up previous views.
    *
    * @method open
    * @param {Backbone.View} view Backbone view to be rendered and placed in the modal
    * @param {Object} options Behavioral options for the modal
    * @param {VelocityObject} options.effect Animation effect to use when opening the modal
    * @param {Boolean} options.fullScreen Make the modal full screen
    */
    open: function (view, options) {
      this._destroyViews();

      this.push(view, options);
    },

    /**
    * Pushes a view onto the modal view stack.
    *
    * @method push
    * @param {Backbone.View} view Backbone view to be rendered and placed in the modal
    * @param {Object} options Behavioral options for the modal
    * @param {VelocityObject} options.effect Animation effect to use when opening the modal
    * @param {Boolean} options.fullScreen Make the modal full screen
    */
    push: function (view, options) {
      this._viewStates.push({ view: view, options: (options || {}) });

      this._show();
    },


    /**
    * Pops the top most view off the view stack.
    *
    * @method pop
    */
    pop: function () {
      var viewState = this._viewStates.pop();

      if (viewState) {
        viewState.view.destroy();
      }

      if (this._viewStates.length > 0) {
        this._show();
      } else {
        this._hide();
      }
    },

    /**
    * Closes the modal.
    *
    * @method close
    * @param {Object} options Options for closing the modal
    * @param {VelocityObject} options.effect Animation effect to use when closing the modal
    */
    close: function (options) {
      this._destroyViews();
      this._hide(options);
    },


    /**
    * Cleans up all the views in the stack and empties the `_viewStates`.
    *
    * @private
    * @method _destroyViews
    */
    _destroyViews: function () {
      _.each(this.viewStates, function (viewState) {
        viewState.view.destroy();
      });

      this._viewStates = [];
    },

    /**
    * Shows the last view in the stack.
    *
    * @private
    * @method _show
    */
    _show: function () {
      var viewState = _.last(this._viewStates);

      viewState.view.render();

      // Force delegate events to fix an issue where restoring a previous view breaks event bindings
      viewState.view.delegateEvents();

      // TODO: Add fancy positioning: likely in the middle of the screen. We're only supporting
      // full screen right now, so it can come later.

      // Add full-screen class if the full screen option is enabled
      if (viewState.options.fullScreen) {
        this.$modal.addClass('full-screen');
      } else {
        this.$modal.removeClass('full-screen');
      }

      // Replace modal contents
      this.$modal.html(viewState.view.el);

      // Animate if an effect is provided
      if (viewState.options.effect) {
        this.$modal.velocity(viewState.options.effect);
      } else {
        this.$modal.show();
      }
    },

    /**
    * Hides the modal.
    *
    * @private
    * @method _hide
    * @param {Object} options Options for closing the modal
    * @param {VelocityObject} options.effect Animation effect to use when closing the modal
    */
    _hide: function (options) {
      options = options || {};

      // Animate if an effect is provided
      if (options.effect) {
        this.$modal.velocity(options.effect, function () {
          // Reset styles and hide
          $(this).removeAttr('style').hide();
        });
      } else {
        this.$modal.hide();
      }
    }
  });

  // Return a singleton
  return new ModalManager();
});
