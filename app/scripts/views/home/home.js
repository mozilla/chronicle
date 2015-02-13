/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'jquery',
  'fullpage',
  'views/base'
], function ($, fullpage, BaseView) {
  'use strict';

  var HomeView = BaseView.extend({
    events: {
      'click .skip-intro':'_skipIntro',
      'click .arrow': '_moveDown'
    },

    initialize: function () {
      this.mediaNames = ['video', 'story', 'photo', 'article', 'song', 'picture'];
      this._setRandomColors();
      this._initializeFullpage();
    },

    // the html is delivered in the page by the server. nothing to render.
    render: function () {
      return this;
    },

    _initializeFullpage: function() {
      $('#landing-page-wrapper').addClass('fade-in');

      /* 
      * invokes the jquery fullpage plugin 
      * https://github.com/alvarotrigo/fullPage.js
      */

      $('#landing-page').fullpage({
        navigation: true,
        navigationPosition: 'right',
        scrollingSpeed: 700,
        touchSensitivity: 25,
        onLeave: this._swapContentHelper.bind(this)
      });

    },

    /* 
    * this following two methods are temporary and will be removed
    * when we have an official color scheme
    */

    _setRandomColors: function() {
      var that = this;
      this.$('.img').each(function(){
        var color = that._generateColor();
        $(this).css('background', color);
      });
    },

    _generateColor: function() {
      var letters = '0123456789ABCDEF'.split('');
      var color = '#';
      for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    },

    _skipIntro: function() {
      $.fn.fullpage.moveTo(5, 0);
    },

    _moveDown: function() {
      $.fn.fullpage.moveSectionDown();
    },

    /* 
    * params come from fullpage.js callback
    * index: index of the leaving section. Starting from 1.
    * nextIndex: index of the destination section. Starting from 1.
    * direction: it will take the values up or down depending on the scrolling direction.
    */

    _swapContentHelper: function(index, nextIndex, direction) {
      if (nextIndex === 2) {
        this._swapContent();
      }   
    },

    _swapContent: function() {
      var $switcherEl = $('.content-switch');
      var index = Math.floor(Math.random() * this.mediaNames.length);
      $switcherEl.html(this.mediaNames[index]);
    }

  });

  return HomeView;
});
