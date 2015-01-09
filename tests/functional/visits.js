/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!bdd',
  'intern/chai!expect'
], function (intern, bdd, expect) {
  'use strict';

  var URL = intern.config.chronicle.url;

  bdd.describe('visits', function () {
    bdd.before(function () {
      // login automatically as the fake user
      this.remote.get(URL + '/auth/login');
    });

    bdd.it('should show a list of recent visits', function () {
      return this.remote
        .get(URL)
        .findAllByCssSelector('.visits')
          .findAllByCssSelector('.visit')
            .then(function (els) {
              expect(els.length).to.be.at.least(1);
            });
    });
  });
});
