# Koishi Plugin Discovery Guide

Use this guide when a user asks you to find Koishi plugins from a market data source.

## Data source

The user will provide a market endpoint URL. Fetch and inspect the current JSON data from that endpoint before making recommendations. Do not assume that package metadata, versions, ratings, download counts, or maintenance status are current without checking the supplied source.

Each plugin record commonly contains a package name, short name, version, description, author, category, keywords, download count, rating, creation and update dates, and links under `package.links`. Field availability can vary, so handle missing fields gracefully.

## Recommendation process

1. Translate the user's requirement into search terms, relevant categories, and constraints.
2. Search the supplied market data using package name, short name, description, keywords, category, and author where useful.
3. Prefer plugins that directly match the stated requirement and have credible, current metadata.
4. Check package links and metadata from the market data when discussing installation, maintenance, compatibility, security, or limitations.
5. Do not fabricate plugin names, versions, links, features, compatibility claims, or test results. State uncertainty when the market data is incomplete.

## Response format

Follow the output options provided by the user. A recommendation item should include the npm package name, a concise reason for the match, the observed version, useful metadata such as author or update date when available, and the npm or repository link when available.

When installation commands are requested, provide commands that are appropriate for a Koishi project and distinguish required configuration or peer dependencies from a simple install command. When comparing candidates, use only verifiable differences from the supplied data and clearly identify inference versus fact.

## Network notes

If the user provides an HTTP proxy address, use it only when network access fails or the environment requires a proxy. Do not claim that a proxy was used unless you actually used it.
