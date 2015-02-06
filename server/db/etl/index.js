/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// TODO: after the db is migrated, push user_pages into elasticsearch, either via
// direct streaming of data, or by exporting chunks of data into S3, then creating
// jobs which point at those files. 
//
// another approach: the master queries the postgres db to determine how many
// user pages exist, and batches them using insert date or maybe using the
// randomness in the uuids.
//
// then, the master puts a special query in a job, and the ETL worker, at the time that
// it runs, asks postgres for that chunk of data, then does the transform, then
// pushes the results into elasticsearch. This sounds good to me: very parallelizable,
// doesn't blow out our queue with data, and avoiding data duplication also lets us
// avoid copying over data that's gone stale between creating + running the job (that
// is, we don't reindex pages that get deleted between the master querying and the
// worker inserting into ES).
//
// this task is already taking too long, so let's do this in a followup patch.
//
// we can use just one worker that pages through the set.
// we only have one elasticsearch instance, so the one worker is fine, there's no
// real gain from parallelization.
