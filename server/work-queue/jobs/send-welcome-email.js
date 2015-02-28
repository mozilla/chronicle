/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var nodemailer = require('nodemailer');
var smtp = require('nodemailer-smtp-transport');

var log = require('../../logger')('server.work-queue.jobs.send-welcome-email');
var config = require('../../config');

var transporter = nodemailer.createTransport();

// Use SMTP transport if we aren't developing locally.
if (config.get('env') !== 'local') {
  transporter = nodemailer.createTransport(smtp({
    host: config.get('email_smtp_host'),
    port: config.get('email_smtp_port'),
    auth: {
      user: config.get('email_smtp_auth_user'),
      pass: config.get('email_smtp_auth_pass')
    }
  }));
}

module.exports = {
  work: function(queue) {
    queue.process('sendWelcomeEmail', function(job, done) {
      var toEmail = job.data.email;
      transporter.sendMail({
        from: config.get('email_fromEmail'),
        to: toEmail,
        subject: 'Welcome to Chronicle',
        text: 'Welcome to Chronicle, ' + toEmail + '!',
        html: 'Welcome to chronicle, <strong>' + toEmail + '</strong>!'
      }, function (err, info) {
        if (err) {
          var msg = 'unable to send email';
          log.error(msg, err);
          return done(new Error(msg));
        }
        log.verbose('welcome email sent');
        done();
      });
    });
  }
};
