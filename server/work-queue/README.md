## work queues == awesoem

Background tasks are offloaded to a work queue.

Currently, each webhead runs its own queue and workers. Queues are implemented using the [node-resque](https://github.com/taskrabbit/node-resque) library on top of [Redis](http://redis.io/).

Pros:
- simple / easy to get started quickly
- don't have to distribute redis
- don't have to get additional work queue instances talking with webhead instances

Cons:
- not persistent / redundant: if we lose a webhead, we lose everything in its queue
- can't add workers easily (need to scale up the whole box)
- can't let idle machines help hammered machines (uneven workload across webhead tier)

Luckily, none of the cons affect us in the early early stages: we don't have significant traffic, and we are dogfooding our own product, and understand that data loss will probably happen.

### code layout

### job interface

This is defined by node-resque:
- a job exposes a `perform` function, with a callback as the last argument in its function signature: `function perform(some, job, args, callback)`
- as usual in node-land, the function signature of the callback is err-first: `function callback(err, result)`.

### flow chart

TBD

### really rough guess at a work queue roadmap

#### version 0: one happy path

- there is a queue
- there is one kind of job
- there is one worker thread
- if work is added by the API code, it gets run by a worker asynchronously

#### version 1: multiple happy paths, one sad path

- define more jobs
- add a larger worker pool
- prioritize the different job types
- handle job failures by logging them (to filesystem/s3?) and deleting from the queue

#### version 2: fancy

- handle recoverable job failures by retrying
- add monitoring / dashboard
- handle queue failure (what if redis is gone or fills up?)
- dynamically adjust number of workers based on system load and monitoring status

### background reading

I actually haven't been able to find a good language-agnostic description of the "work queue" or "task queue" concept, together with a list of app-level implementation concerns, like monitoring or retry logic.

- More practical, app-focused guide from Heroku: https://devcenter.heroku.com/articles/background-jobs-queueing
- This doc is really high-level, kinda has that UML fluff thing about it, but might be informative: http://parlab.eecs.berkeley.edu/wiki/_media/patterns/taskqueue.pdf
