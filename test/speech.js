const expect = require('chai').expect
const eventSpeech = require('../src/speech')
const getParsedRequest = eventSpeech.getParsedRequest
describe('speech', function () {
  describe('getParsedRequest', function () {
    it('should figure out the request mode', function () {
      expect(getParsedRequest('testing').mode).to.be.undefined
      expect(getParsedRequest('some events please').mode).to.equal('event')
      expect(getParsedRequest('some repos please').mode).to.equal('repo')
      expect(getParsedRequest('some repository please').mode).to.equal('repo')
    })
  })

  describe('getParsedRequest date', function () {
    it('should detect if there is a date', function () {
      // No date means undefined
      expect(getParsedRequest('testing').dates).to.be.undefined
    })

    it('should figure out the date requested', function () {
      // This doesn't test much since tests should be covered in nlp_compromise
      expect(getParsedRequest('july 4th').dates.month).to.equal(6)
      expect(getParsedRequest('4-july').dates.year).to.equal((new Date()).getUTCFullYear())
      expect(getParsedRequest('july 4th 2020').dates.year).to.equal(2020)
      expect(getParsedRequest('I married April for the 2nd time on June 5th 1998').dates.year).to.equal(1998)
      expect(getParsedRequest('upcoming events on jun 23rd').dates.month).to.equal(5)
    })
  })
})
