# bot

Facebook Messenger bot for querying the upcoming open events and recently updated repositories. Type "upcoming events" to try!


[![Build Status](https://travis-ci.org/webuildsg/bot.svg?branch=master)](https://travis-ci.org/webuildsg/bot)
[![Coverage Status](https://coveralls.io/repos/github/webuildsg/bot/badge.svg?branch=master)](https://coveralls.io/github/webuildsg/bot?branch=master)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

![](screenshot.png)

## Usage

* Type "upcoming events" to receive a list of up to 5 upcoming events for the day. 5 is a limit set by Facebook.
* Type "upcoming events on June 12" to receive a list of events similar to the above but for only June 12.

## Running

You need a valid Facebook Access token and Google Maps API key for this app to work:

```
export mapsApiKey=<YourGoogleMapsApiKey> && \
export verifyToken=<YourVerifyToken> && \
export accessToken=<YourAccessToken> && \
node index.js
```
