const process = require('process')
const request = require('request')
const accessToken = process.env.accessToken

exports.text = function (senderId, text) {
  var messageData = {
    text: text
  }
  generic(senderId, messageData)
}

exports.buttons = function (senderId, text, buttons) {
  var messageData = {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: text,
        buttons: buttons
      }
    }
  }
  generic(senderId, messageData)
}

/**
 * generic send
 * @param  {[type]} senderId [description]
 * @param  {[type]} message  [description]
 * @return {[type]}          [description]
 */
function generic (senderId, message) {
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
