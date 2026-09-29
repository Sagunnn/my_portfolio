---
layout: layouts/article.njk
tags: [ddiaChapter, post]
date: 2026-09-28
chapter: 2
chapterTitle: Defining Nonfunctional Requirements
menuLabel: Ch 2 · Requirements
menuNote: "How well, not just what: percentiles, faults vs failures, scalability and maintainability."
cardText: Response times and percentiles, faults vs failures, what scalability really means, and why most of a system's cost comes after launch.
title: "DDIA Chapter 2 Summary: Defining Nonfunctional Requirements | Sagun B. Pradhan"
description: "Notes on chapter 2 of Designing Data-Intensive Applications (2nd edition): response times and percentiles, faults vs failures, scalability and maintainability."
ogTitle: "DDIA Chapter 2: how well, not just what"
nav: writing
hud: true
back: { href: /writing/ddia/, label: ← Reading DDIA }
eyebrow: DDIA notes · Chapter 2
heading: How well, not just what
lede: "Chapter 2 is about the requirements nobody writes in the ticket: how fast, how reliable, how big and how easy to change. It gives you the words to argue about them, and a few numbers to argue with."
facts:
  - ["Book", "DDIA, 2nd edition"]
  - ["Authors", "Martin Kleppmann &amp; Chris Riccomini"]
  - ["Chapter", "Defining Nonfunctional Requirements"]
takeaways:
  - "Hello there! SAGUN made it to CHAPTER 2 of DDIA! This one is about how WELL a system works, not just what it does."
  - "Averages hide pain. Look at percentiles: the p99 is what your unluckiest users feel."
  - "One slow backend can make a whole request slow. The more services a request touches, the more the slow tail matters."
  - "A fault is one part breaking. A failure is the whole system letting users down. Good design stops faults from becoming failures."
  - "People cause a lot of outages. Give them safe places to test, quick rollbacks and good monitoring, not blame."
  - "Scalability isn't a yes or no. Ask: if load grows in THIS way, what are our options?"
  - "Most of a system's cost comes after launch. Build it so others can run it, understand it and change it."
  - "SAGUN's DDIA level went up again! Next stop: CHAPTER 3!"
---
{% section "The gist", "The requirements nobody writes down", "gist" %}
A feature request says what an app should *do*: show a timeline, send a message, run a
report. It rarely says how fast, how often it may break, how much load it must take or how
easy it must be to change later. Those are **nonfunctional requirements**, and Chapter 2 is
about making them concrete enough to design for.

The chapter runs one example all the way through: a social network's **home timeline**,
where opening the app shows recent posts from everyone you follow. You can build it by
querying at read time, which gets expensive for people who follow thousands of accounts.
Or you can precompute each user's timeline whenever someone posts, called *fan-out on
write*, which makes reading cheap and posting expensive, especially for an account with
millions of followers. Neither is free, and deciding between them is exactly what the
rest of the chapter gives you tools for.
{% endsection %}

{% section "Requirement 01", "Performance: look at the tail", "performance" %}
Two numbers describe performance. **Throughput** is how much work gets done per second.
**Response time** is how long one request takes from the user's point of view, including
network delays and time spent waiting in a queue. The chapter keeps these apart from
*latency*, the time a request spends waiting before anything works on it.

Response time isn't one number, because the same request can take 40 ms one moment and
a second the next. So the chapter argues for **percentiles** instead of averages. The
median (p50) is what a typical user sees. The p95, p99 and p999 are what your slowest
requests look like, and those are often your heaviest users, the ones with the most data.
{% endsection %}

<figure class="figure"><div class="figure__scroll"><svg viewBox="0 0 900 320" role="img" aria-label="Forty illustrative response times sorted from fastest to slowest. Most take 40 to 100 milliseconds; the slowest few take up to 900 milliseconds. The median is 79 ms, the mean 128 ms, the p95 380 ms and the slowest request 900 ms."><g font-family="'JetBrains Mono', monospace" font-size="12" fill="#eedec1" fill-opacity=".6"><text x="50" y="274" text-anchor="end">0</text><text x="50" y="148" text-anchor="end">500</text><text x="50" y="47" text-anchor="end">900</text><text x="60" y="306">fastest</text><text x="870" y="306" text-anchor="end">slowest</text><text x="450" y="306" text-anchor="middle">40 requests, sorted · response time in ms</text></g><path d="M60 270.0 H870" stroke="#eedec1" stroke-opacity=".3"/><rect x="62.0" y="259.9" width="16.2" height="10.1" fill="#eedec1" fill-opacity=".35"/><rect x="82.2" y="259.4" width="16.2" height="10.6" fill="#eedec1" fill-opacity=".35"/><rect x="102.5" y="258.9" width="16.2" height="11.1" fill="#eedec1" fill-opacity=".35"/><rect x="122.8" y="258.4" width="16.2" height="11.6" fill="#eedec1" fill-opacity=".35"/><rect x="143.0" y="257.9" width="16.2" height="12.1" fill="#eedec1" fill-opacity=".35"/><rect x="163.2" y="257.4" width="16.2" height="12.6" fill="#eedec1" fill-opacity=".35"/><rect x="183.5" y="256.9" width="16.2" height="13.1" fill="#eedec1" fill-opacity=".35"/><rect x="203.8" y="256.4" width="16.2" height="13.6" fill="#eedec1" fill-opacity=".35"/><rect x="224.0" y="255.9" width="16.2" height="14.1" fill="#eedec1" fill-opacity=".35"/><rect x="244.2" y="255.3" width="16.2" height="14.7" fill="#eedec1" fill-opacity=".35"/><rect x="264.5" y="254.8" width="16.2" height="15.2" fill="#eedec1" fill-opacity=".35"/><rect x="284.8" y="254.3" width="16.2" height="15.7" fill="#eedec1" fill-opacity=".35"/><rect x="305.0" y="253.8" width="16.2" height="16.2" fill="#eedec1" fill-opacity=".35"/><rect x="325.2" y="253.3" width="16.2" height="16.7" fill="#eedec1" fill-opacity=".35"/><rect x="345.5" y="252.8" width="16.2" height="17.2" fill="#eedec1" fill-opacity=".35"/><rect x="365.8" y="252.3" width="16.2" height="17.7" fill="#eedec1" fill-opacity=".35"/><rect x="386.0" y="251.8" width="16.2" height="18.2" fill="#eedec1" fill-opacity=".35"/><rect x="406.2" y="251.3" width="16.2" height="18.7" fill="#eedec1" fill-opacity=".35"/><rect x="426.5" y="250.8" width="16.2" height="19.2" fill="#eedec1" fill-opacity=".35"/><rect x="446.8" y="250.3" width="16.2" height="19.7" fill="#eedec1" fill-opacity=".35"/><rect x="467.0" y="249.8" width="16.2" height="20.2" fill="#eedec1" fill-opacity=".35"/><rect x="487.2" y="249.3" width="16.2" height="20.7" fill="#eedec1" fill-opacity=".35"/><rect x="507.5" y="248.8" width="16.2" height="21.2" fill="#eedec1" fill-opacity=".35"/><rect x="527.8" y="248.3" width="16.2" height="21.7" fill="#eedec1" fill-opacity=".35"/><rect x="548.0" y="247.8" width="16.2" height="22.2" fill="#eedec1" fill-opacity=".35"/><rect x="568.2" y="247.3" width="16.2" height="22.7" fill="#eedec1" fill-opacity=".35"/><rect x="588.5" y="246.8" width="16.2" height="23.2" fill="#eedec1" fill-opacity=".35"/><rect x="608.8" y="246.3" width="16.2" height="23.7" fill="#eedec1" fill-opacity=".35"/><rect x="629.0" y="245.7" width="16.2" height="24.3" fill="#eedec1" fill-opacity=".35"/><rect x="649.2" y="245.2" width="16.2" height="24.8" fill="#eedec1" fill-opacity=".35"/><rect x="669.5" y="242.2" width="16.2" height="27.8" fill="#eedec1" fill-opacity=".35"/><rect x="689.8" y="238.4" width="16.2" height="31.6" fill="#eedec1" fill-opacity=".35"/><rect x="710.0" y="234.6" width="16.2" height="35.4" fill="#eedec1" fill-opacity=".35"/><rect x="730.2" y="229.6" width="16.2" height="40.4" fill="#eedec1" fill-opacity=".35"/><rect x="750.5" y="222.0" width="16.2" height="48.0" fill="#eedec1" fill-opacity=".35"/><rect x="770.8" y="211.9" width="16.2" height="58.1" fill="#eedec1" fill-opacity=".35"/><rect x="791.0" y="196.7" width="16.2" height="73.3" fill="#eedec1" fill-opacity=".35"/><rect x="811.2" y="174.0" width="16.2" height="96.0" fill="#d7212c" fill-opacity=".9"/><rect x="831.5" y="138.6" width="16.2" height="131.4" fill="#d7212c" fill-opacity=".9"/><rect x="851.8" y="42.6" width="16.2" height="227.4" fill="#d7212c" fill-opacity=".9"/><path d="M60 237.7 H870" stroke="#f7d30e" stroke-width="2" stroke-dasharray="6 5"/><text x="68" y="229.7" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700" fill="#f7d30e">mean 128 ms</text><path d="M465.0 30 V270.0" stroke="#5fb4cf" stroke-width="2"/><text x="473.0" y="44" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700" fill="#5fb4cf">p50 79 ms</text><path d="M819.4 70 V270.0" stroke="#f08a8f" stroke-width="2"/><text x="811.4" y="84" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700" fill="#f08a8f">p95 380 ms</text></svg></div><figcaption>Fig. 1 — 40 illustrative response times, sorted. The mean is pulled up by a handful of slow requests, so it describes nobody; the percentiles say what the typical and the unlucky user actually get.</figcaption></figure>

{% section "", "Why the tail gets worse", "tail" %}
Two effects make slow requests matter more than their share suggests:

- **Tail latency amplification.** If one page needs answers from ten backend calls, it's as
  slow as the slowest of the ten. A 1-in-100 slow call turns into a much more common slow page.
- **Queueing.** A few slow requests can hold up the fast ones behind them, so measuring on
  the server alone can make things look better than users experience.

That's why service agreements are written in percentiles, like "p99 under 1 second",
rather than averages.

{% take %}
The async ETL pipeline I built was a **throughput** story, not a response-time one. It
didn't make any single API call faster. It kept many calls in flight at once, so more
wallets got processed per minute. Having separate words for the two made it easier to say
what actually improved.
{% endtake %}

{% take %}
My AWS Lambda monitoring reported whether each crawler run **passed or failed**. After this
chapter I'd also track how long runs take, as percentiles. A run that succeeds but takes
three times longer than usual is an early warning, and a pass/fail check can't see it.
{% endtake %}
{% endsection %}

{% section "Requirement 02", "Reliability: faults aren't failures", "reliability" %}
The chapter draws a line I'll keep using: a **fault** is one part going wrong, like a
disk, a process or a network link. A **failure** is the system as a whole no longer
giving users the service they need. Reliable systems are **fault-tolerant**: they expect
faults and stop them from turning into failures. Some teams even inject faults on purpose,
to prove the tolerance works before a real outage tests it.

| Kind of fault | Example | Main defence |
|---|---|---|
| Hardware | A disk dies, a machine loses power | Redundancy: replicas, spare machines, software that survives losing a node |
| Software | A bug that hits every node at once, a runaway process | Testing, isolating components, fast rollback, monitoring |
| Human | A bad config push, the wrong command in production | Safe places to experiment, gradual rollouts, easy undo, learning without blame |

Hardware faults tend to be random and independent. Software faults are the scarier kind,
because the same bug runs on every machine at once. And people cause a large share of
outages, which the chapter treats as a design problem rather than a discipline problem:
make the right thing easy, the wrong thing hard, and mistakes cheap to undo. Blameless
postmortems exist so that people report what happened honestly.

{% take %}
Looking back, the script I wrote to copy production PostgreSQL data into dev and QA was a
**reliability** tool. It gave people a realistic place to make mistakes that didn't matter,
which is one of the chapter's main defences against human error.
{% endtake %}
{% endsection %}

{% section "Requirement 03", "Scalability: grows how?", "scalability" %}
"Is it scalable?" is the wrong question. A better one is: *if the load grows in this
particular way, what are our options?* That means first describing the load, for example
requests per second, the ratio of reads to writes, the amount of data or the number of
users online at once, and then asking which part breaks first.

| Architecture | What it means | Trade-off |
|---|---|---|
| Shared-memory (scale up) | A bigger machine | Simple, but cost climbs steeply and there's a ceiling |
| Shared-disk | Several machines, one shared storage system | Used by some warehouses, but contention limits how far it goes |
| Shared-nothing (scale out) | Independent machines, each with its own storage | Scales furthest, but now it's a distributed system (see Chapter 1) |

The advice is to split systems into parts that can grow independently, and not to build
for scale you don't have yet. Architectures that fit one level of load rarely fit ten times
that, so expect to rethink as you grow.
{% endsection %}

{% section "Requirement 04", "Maintainability: the cost after launch", "maintainability" %}
Most of the cost of software comes after it ships: fixing bugs, keeping it running, adapting
it to new needs and paying down old decisions. The chapter splits maintainability into three
goals:

- **Operability:** make it easy for the people running it to see what it's doing and keep it healthy.
- **Simplicity:** remove *accidental* complexity, the kind that comes from the implementation
  rather than the problem, mostly through good abstractions.
- **Evolvability:** make it easy to change when requirements change, which they will.

{% pushback %}
The timeline example is very web-app flavoured. From a data engineering seat the same ideas
apply, since precomputing a timeline is really precomputing an aggregate, but you have to
do that translation yourself.
{% endpushback %}

{% pushback %}
The percentile advice is right, but measuring percentiles properly needs histogram tooling a
small team may not have. A cheap place to start: log every request's or run's duration and
compute the p95 once a day in SQL.
{% endpushback %}

{% pushback %}
Maintainability gets the least concrete treatment, even though the chapter says it's where
most of the cost is. Simplicity is hard to measure, and the section reads more like
principles than practice.
{% endpushback %}
{% endsection %}

{% section "Verdict", "The most practical chapter so far", "verdict" %}
Chapter 1 gave me the vocabulary for architecture. Chapter 2 gives me the vocabulary for
design reviews: *p99*, *throughput vs response time*, *fault vs failure*, *operability*.
It's the chapter I'd hand to someone before their first on-call rotation.

**Next up:** [Chapter 3](/writing/ddia/ch03/), on data models and query languages.
{% endsection %}
