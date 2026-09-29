---
layout: layouts/article.njk
tags: [ddiaChapter, post]
date: 2026-09-29
chapter: 3
chapterTitle: Data Models and Query Languages
menuLabel: Ch 3 · Data models
menuNote: "Shape data for how you read it: relational, document, graph, event logs and dataframes."
cardText: Relational vs document, star schemas for analytics, graphs, event sourcing, and why declarative queries win.
title: "DDIA Chapter 3 Summary: Data Models and Query Languages | Sagun B. Pradhan"
description: "Notes on chapter 3 of Designing Data-Intensive Applications (2nd edition): relational vs document models, star schemas, graph models, event sourcing, dataframes and declarative queries."
ogTitle: "DDIA Chapter 3: shape your data for how you read it"
nav: writing
hud: true
back: { href: /writing/ddia/, label: ← Reading DDIA }
eyebrow: DDIA notes · Chapter 3
heading: Shape your data for how you read it
lede: "Chapter 3 is about the first decision in any data system: what shape the data takes. Tables, documents, graphs, event logs or dataframes. Each shape makes some questions easy and others painful, so the right one depends on how you'll read the data."
facts:
  - ["Book", "DDIA, 2nd edition"]
  - ["Authors", "Martin Kleppmann &amp; Chris Riccomini"]
  - ["Chapter", "Data Models and Query Languages"]
takeaways:
  - "Hello there! SAGUN reached CHAPTER 3 of DDIA! This one is about the SHAPE of your data."
  - "Pick a data model for how you'll READ the data. Every model makes some questions easy and others painful."
  - "Documents are great when you load a whole record at once. Relational tables shine when records point at each other."
  - "Normalizing saves you from updating the same fact in ten places. Denormalizing makes reads fast. You pay one way or the other."
  - "A schema never disappears. Without one in the database, it just moves into your code."
  - "For analytics, think in stars: a fact table of events, surrounded by dimensions that describe them."
  - "Store what happened as events, and everything else can be rebuilt from them. A blockchain works exactly like that!"
  - "Say WHAT you want, not HOW to get it, and the database can find a faster way. Next stop: CHAPTER 4!"
---
{% section "The gist", "The shape comes first", "gist" %}
Every application is built from layers of data models: objects in your code, stored as
tables or JSON, stored as bytes, stored on hardware. Each layer hides the one below it.
Chapter 3 is about the layer you choose most directly, the one your data is stored in,
because that choice decides which questions are easy to ask later.

The chapter walks through five shapes, and for each one it asks the same thing: *what does
this make easy, and what does it make painful?*
{% endsection %}

| Model | Data looks like | Good at | Example |
|---|---|---|---|
| Relational | Rows in tables, linked by IDs | Joins, many-to-many relationships, questions nobody planned for | PostgreSQL |
| Document | Self-contained JSON trees | Loading a whole record in one read, fields that vary | MongoDB |
| Graph | Vertices and the edges between them | Following relationships to any depth | Neo4j |
| Event log | An append-only history of what happened | Audits, rebuilding state, many read views | Kafka, a blockchain |
| Dataframe / array | Columns and matrices of values | Analysis and machine learning | pandas, Polars |

{% section "Model 01", "Relational vs document", "relational" %}
Code works with nested objects. Relational databases store flat rows. Translating between
the two is the classic *object-relational mismatch*, and ORMs only partly hide it. Document
databases avoid it: a user profile with its list of jobs and schools is just one JSON
document, read and written in one go.

The trouble starts when records point at each other. If a thousand profiles mention the same
company, you can store the company's name in each one (**denormalized**: fast to read, but a
rename means a thousand updates) or store an ID that points to one company record
(**normalized**: one place to update, but reads need a join). As data gets more
interconnected, with many-to-one and many-to-many relationships, joins matter more, and
that's where the relational model is strongest.

Two more trade-offs:

- **Schema-on-write vs schema-on-read.** A relational database checks the structure when data
  is written. A document store accepts anything, and your code interprets it when reading.
- **Locality.** A document is stored in one place, so reading all of it is fast, but reading one
  small field still loads the whole thing.

The line between the two keeps blurring: PostgreSQL stores and queries JSON columns, and
document databases have added joins. The useful question isn't which product, but which
shape fits how you read the data.

{% take %}
My ScamFilter pipeline ended up using both, for exactly the chapter's reasons. Raw
transactions live as **rows in PostgreSQL**, because they're queried by wallet, sorted by
time and upserted in bulk. Each user's metrics live as **one MongoDB document**, because
they're always read whole, updated with new totals and written back.
{% endtake %}

{% take %}
Schema-on-read is real: the schema doesn't disappear, it moves into your code. Etherscan's
JSON has no schema I control, so the pipeline's first step renames and checks the fields
it needs before anything else touches them. That step *is* the schema.
{% endtake %}
{% endsection %}

{% section "Model 02", "Stars and snowflakes", "stars" %}
Analytics has its own classic shape. A **fact table** in the middle holds one row per event,
such as a sale or a transfer, with numbers you add up. Around it, **dimension tables** describe
the who, what, where and when. Draw it and it looks like a star, hence **star schema**. Split
the dimensions into further tables and you get a *snowflake*. Many modern warehouses go the other
way and flatten everything into one wide table, trading storage for simpler queries.
{% endsection %}

<figure class="figure"><div class="figure__scroll"><svg viewBox="0 0 900 360" role="img" aria-label="An illustrative star schema for wallet analytics: a fact_transfers table in the middle with wallet, date, chain and token IDs plus amount and gas fee, linked to four dimension tables: dim_wallet, dim_date, dim_chain and dim_token."><g fill="none" stroke="#eedec1" stroke-opacity=".45" stroke-width="2"><path d="M270 95 L330 150"/><path d="M630 95 L570 150"/><path d="M270 265 L330 220"/><path d="M630 265 L570 220"/></g><g fill="#151c1a" stroke="#eedec1" stroke-opacity=".35" stroke-width="1.5"><rect x="40" y="30" width="230" height="86"/><rect x="630" y="30" width="230" height="86"/><rect x="40" y="244" width="230" height="86"/><rect x="630" y="244" width="230" height="86"/></g><rect x="330" y="120" width="240" height="120" fill="#151c1a" stroke="#f7d30e" stroke-width="2.5"/><g font-family="'JetBrains Mono', monospace" fill="#eedec1"><text x="450" y="148" font-size="15" font-weight="700" text-anchor="middle" fill="#f7d30e">fact_transfers</text><text x="450" y="174" font-size="12" text-anchor="middle" fill-opacity=".75">wallet_id · date_id</text><text x="450" y="194" font-size="12" text-anchor="middle" fill-opacity=".75">chain_id · token_id</text><text x="450" y="218" font-size="12" text-anchor="middle" fill-opacity=".75">amount · gas_fee</text><text x="60" y="60" font-size="14" font-weight="700">dim_wallet</text><text x="60" y="84" font-size="12" fill-opacity=".65">address · first_seen</text><text x="60" y="102" font-size="12" fill-opacity=".65">health_status</text><text x="650" y="60" font-size="14" font-weight="700">dim_date</text><text x="650" y="84" font-size="12" fill-opacity=".65">day · month · year</text><text x="650" y="102" font-size="12" fill-opacity=".65">gas_era</text><text x="60" y="274" font-size="14" font-weight="700">dim_chain</text><text x="60" y="298" font-size="12" fill-opacity=".65">name · layer (L1 / L2)</text><text x="60" y="316" font-size="12" fill-opacity=".65">fifo_ordering</text><text x="650" y="274" font-size="14" font-weight="700">dim_token</text><text x="650" y="298" font-size="12" fill-opacity=".65">symbol · decimals</text><text x="650" y="316" font-size="12" fill-opacity=".65">contract_address</text></g></svg></div><figcaption>Fig. 1 — An illustrative star schema for the wallet analytics I work with: transfers in the middle, the things that describe them around it.</figcaption></figure>

{% section "", "Why it clicked for me", "stars-take" %}
{% take %}
My wallet metrics were computed straight from raw transaction lists. If I rebuilt the
analytics side, I'd model it as the star above: every transfer a fact, with wallets, dates,
chains and tokens as dimensions. Questions like "gas spent per chain per month" become one
simple query instead of custom code.
{% endtake %}
{% endsection %}

{% section "Model 03", "Graphs: when everything is connected", "graphs" %}
When anything can relate to anything, like people, places and events, a **graph** fits better
than tables. The chapter covers *property graphs*, where vertices and edges both carry
properties and are queried with languages like **Cypher**, and *triple-stores*, which describe
everything as subject–predicate–object and are queried with **SPARQL**. It also covers
**Datalog**, an older rule-based language that builds complex queries from small parts. The
point it makes clearly: a question like "follow these links any number of steps" is a short
graph query, but a long, awkward recursive query in SQL.

The chapter also covers **GraphQL**, which despite the name isn't a graph database. It's a way
for clients to ask an API for exactly the data they need.

{% pushback %}
For a typical data engineering job, the graph section is long relative to how often you'd
reach for a graph database. For blockchain data, though, it clicked. Transfers between
addresses *are* a graph. ScamFilter's "mixer-funded recipient" signal is a graph question
in disguise: where did this wallet's very first gas come from?
{% endpushback %}
{% endsection %}

{% section "Model 04", "Event sourcing: store what happened", "events" %}
Instead of storing the current state and overwriting it, **event sourcing** stores every
change as an immutable event, like "deposit made" or "item shipped", and derives the current state
from them. **CQRS** (command query responsibility segregation) takes it further: write events in
one place, and build separate read-optimised views for each way the data is queried. Nothing is
lost, any view can be rebuilt, and new views can be added later. The cost is more moving parts,
and "current state" is always computed, never just stored.

{% take %}
A blockchain is event sourcing at planet scale. The chain is an append-only log of
transactions, and a wallet's balance is derived state you compute by replaying them. It's the
same idea as Chapter 1's *system of record* and *derived data*, and it's why every table in my
pipeline could be rebuilt from the chain.
{% endtake %}
{% endsection %}

{% section "Model 05", "Dataframes and arrays", "dataframes" %}
Finally, the chapter makes room for the model analysts and ML engineers actually work in:
**dataframes**, tables held in memory and transformed column by column, and the **matrices and
arrays** underneath machine learning. They're less about storage and more about computation,
but they're a data model all the same, with their own trade-offs.

{% pushback %}
Dataframes get a short section, even though a lot of real data engineering happens in them.
My whole metrics engine runs in Polars. I'd have liked more on when to stay in a dataframe
versus pushing work down into the database.
{% endpushback %}
{% endsection %}

{% section "Querying", "Say what, not how", "declarative" %}
Running through the whole chapter is one argument for **declarative** query languages. In SQL
you describe *what* you want, which rows and which totals, and the database decides *how* to
get it: which index, which join order, whether to run it in parallel. Code that loops over
records describes the *how* itself, so it can't get faster when the database learns a better
strategy. Declarative queries are also shorter, and easier to read and to optimise.
{% endsection %}

{% section "Verdict", "The chapter that makes you draw boxes", "verdict" %}
Chapter 3 is where the book starts to feel practical in a new way. It changes how you sketch
a system: before choosing a database, you draw the shape of the data and the questions you'll
ask of it. It covers a lot of ground, and some models get only a sketch, but the rule that
connects them is simple: *model for how you read*.

**Next up:** Chapter 4, on storage and retrieval: how databases lay data out on disk.
{% endsection %}
