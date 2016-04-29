const process = require('process')
const request = require('request')
const accessToken = process.env.accessToken

exports.text = function (senderId, text) {
  var messageData = {
    text: text
  }
  api(senderId, messageData)
}

exports.template = function (senderId, payload) {
  var messageData = {
    attachment: {
      type: 'template',
      payload: payload
    }
  }
  api(senderId, messageData)
}

/**
 * For generic templates
 * @param  {[type]} senderId [description]
 * @param  {[type]} elements [description]
 * @return {[type]}          [description]
 */
exports.genericTemplate = function (senderId, elements) {
  exports.template(senderId, {
    template_type: 'generic',
    elements: elements
  })
}

exports.buttons = function (senderId, text, buttons) {
  exports.template(senderId, {
    template_type: 'button',
    text: text,
    buttons: buttons
  })
}

/**
 * generic send api
 * @param  {[type]} senderId [description]
 * @param  {[type]} message  [description]
 * @return {[type]}          [description]
 */
function api (senderId, message) {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
      access_token: accessToken
    },
    method: 'POST',
    json: {
      recipient: {
        id: senderId
      },
      message: message
    }
  }, function (error, response) {})
}
