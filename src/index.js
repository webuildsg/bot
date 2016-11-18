'use strict'
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const config = require('config')
const send = require('./send')
const Datastore = require('nedb')
const users = new Datastore({ filename: './data/users', autoload: true })
const eventSpeech = require('./speech')
const app = express()
const verifyToken = config.get('validationToken')
const mapsApiKey = config.get('mapsApiKey')

app.use(bodyParser.json())
app.set('json spaces', 2)

const Ranka = require('ranka')
const ranka = new Ranka({
  validationToken: config.get('validationToken'),
  pageAccessToken: config.get('pageAccessToken')
})
app.use('/webuild/bot/webhook', Ranka.router({
  ranka: ranka
}))

ranka.on('message', (req, res) => {

  // users.findOne({ id: recipientId }, function (err, doc) {
  //   if (doc === null) {
  //     users.insert({ id: recipientId })
  //   }
  // })

  if (req.body.message.text === 'hi') {
    res.send({
      text: 'Please share your location:',
      quick_replies: [
        {
          content_type: 'location'
        }
      ]
    }).exec()
  } else {
    console.log(222, req.body)
    const eventRequest = eventSpeech.getParsedRequest(req.body.message.text)
    console.log(223, eventRequest)
    if (eventRequest.mode === 'event') {
      upcomingEvent(req.body.sender.id, eventRequest, req, res)
    } else if (eventRequest.mode === 'repo') {
      latestRepo(req.body.sender.id, req, res)
    }
  }
})
// app.get('/*', (req, res) => {
//   const q = req.query
//   // If the token doesn't match...
//   if (q['hub.verify_token'] !== verifyToken) {
//     res.sendStatus(401)
//   }
//   if (q['hub.mode'] === 'subscribe') {
//     res.send(q['hub.challenge'])
//   } else {
//     res.send(req.headers)
//   }
// })

/**
 * Fetches the latest 5 repositories
 * @param  {[type]} recipientId [description]
 */
function latestRepo (recipientId, req, res) {
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

function sendEvent (recipientId, events, req, res) {
  const eventCount = +events.meta.total_events
  if (eventCount === 0) {
    res
      .sendText('No events found :( Try another day')
      .exec()
  } else if (eventCount > 0) {
    const eventsDisplay = events.meta.total_events === 1 ? 'event' : 'events'
    var eventElements = generateFbPayload(events.events)
    res
      .sendText(`We found you ${eventCount} cool ${eventsDisplay} for you to join!`)
      .typing()
      .wait(1000)
      .sendText(`Did you say "${req.body.message.text}"?`)
      .sendAttachmentWithPayload('template', eventElements)
      .exec()
  }
}

/**
 * Fetches 5 upcoming events or by event date
 * @param  {[type]} recipientId [description]
 */
function upcomingEvent (recipientId, eventRequest, req, res) {
  if (eventRequest.dates) {
    request(`https://webuild.sg/api/v1/check/${eventRequest.dates.year}-${eventRequest.dates.month + 1}-${eventRequest.dates.day}?n=5`, (err, resp, body) => {
      if (!err) {
        const parsed = JSON.parse(body)
        sendEvent(recipientId, parsed, req, res)
      }
    })
  } else {
    request('https://webuild.sg/api/v1/events?n=5', (err, resp, body) => {
      if (!err) {
        const parsed = JSON.parse(body)
        sendEvent(recipientId, parsed, req, res)
      }
    })
  }
}

app.listen(3124, () => {
  console.log('Example app listening on port 3124!')
})
