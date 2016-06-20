'use strict'
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const process = require('process')
const send = require('./send')
const Datastore = require('nedb')
const users = new Datastore({ filename: './data/users', autoload: true })
const eventSpeech = require('./speech')
const app = express()
const verifyToken = process.env.verifyToken
const mapsApiKey = process.env.mapsApiKey

app.use(bodyParser.json())
app.set('json spaces', 2)

app.get('/*', (req, res) => {
  const q = req.query
  // If the token doesn't match...
  if (q['hub.verify_token'] !== verifyToken) {
    res.sendStatus(401)
  }
  if (q['hub.mode'] === 'subscribe') {
    res.send(q['hub.challenge'])
  } else {
    res.send(req.headers)
  }
})

app.post('/*', (req, res) => {
  const messaging = req.body.entry[0].messaging
  if (messaging) {
    messaging.forEach((item) => {
      const recipientId = item.sender.id
      if (item.message && item.message.text) {
        users.findOne({ id: recipientId }, function (err, doc) {
          if (doc === null) {
            users.insert({ id: recipientId })
          }
        })
        processMessageText(item.sender.id, item.message.text)
      } else if (item.postback && item.postback.payload) {
        processPayload(recipientId, item.postback.payload)
      }
    })
  }
  res.sendStatus(200)
})

function processPayload (recipientId, payload) {
  if (payload.startsWith('EVENT_')) {
    const jsonPayload = payload.slice(6) // because event_ is 6 characters
  }
}

function processMessageText (recipientId, text) {
  const eventRequest = eventSpeech.getParsedRequest(text)
  if (eventRequest.mode === 'event') {
    upcomingEvent(recipientId, eventRequest)
  } else if (eventRequest.mode === 'repo') {
    latestRepo(recipientId)
  }
}

/**
 * Fetches the latest 5 repositories
 * @param  {[type]} recipientId [description]
 */
function latestRepo (recipientId) {
  request('https://webuild.sg/api/v1/repos?n=5', (err, resp, body) => {
    if (!err) {
      const parsed = JSON.parse(body)
      parsed.repos.forEach((repo) => {
        send.text(
          recipientId,
          `${repo.owner.login}/${repo.name}
${repo.html_url}
          `
        )
      })
    }
  })
}

function generateFbPayload (events) {
  const nomap = 'https://raw.githubusercontent.com/webuildsg/bot/master/no-map.png'
  return events.map((event) => {
    let payload = {
      title: `${event.name}`,
      'image_url': nomap,
      'subtitle': `${event.group_name} | ${event.formatted_time}`,
      'buttons': [
        {
          'type': 'web_url',
          'url': event.url,
          'title': 'View Event'
        },
        {
          'type': 'web_url',
          'url': event.group_url,
          'title': 'View Group'
        }
      ]
    }
    if (event.latitude && event.longitude) {
      payload.image_url = `https://maps.googleapis.com/maps/api/staticmap?zoom=13&size=500x500&maptype=roadmap&markers=color:red%7C${event.latitude},${event.longitude}&key=${mapsApiKey}`
      payload.buttons.unshift({
        'type': 'web_url',
        'url': `https://maps.google.com/maps?f=q&hl=en&q=${event.latitude},${event.longitude}`,
        'title': 'Get Directions'
      })
    }
    return payload
  })
}

function sendEvent (recipientId, events) {
  const eventCount = +events.meta.total_events
  if (eventCount === 0) {
    send.text(recipientId, 'No events found :( Try another day')
  } else if (eventCount > 0) {
    const eventsDisplay = events.meta.total_events === 1 ? 'event' : 'events'
    if (eventCount === 1) {
    }
    send.text(recipientId, `We found you ${eventCount} cool ${eventsDisplay} for you to join!`)
    var eventElements = generateFbPayload(events.events)
    send.genericTemplate(recipientId, eventElements)
  }
}

/**
 * Fetches 5 upcoming events or by event date
 * @param  {[type]} recipientId [description]
 */
function upcomingEvent (recipientId, eventRequest) {
  if (eventRequest.dates) {
    request(`https://webuild.sg/api/v1/check/${eventRequest.dates.year}-${eventRequest.dates.month + 1}-${eventRequest.dates.day}?n=5`, (err, resp, body) => {
      if (!err) {
        const parsed = JSON.parse(body)
        sendEvent(recipientId, parsed)
      }
    })
  } else {
    request('https://webuild.sg/api/v1/events?n=5', (err, resp, body) => {
      if (!err) {
        const parsed = JSON.parse(body)
        sendEvent(recipientId, parsed)
      }
    })
  }
}

app.listen(3124, () => {
  console.log('Example app listening on port 3124!')
})
