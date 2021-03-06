/* global describe, beforeEach, afterEach, it, expect */

var postToApi = require('../../src/js/post-api-data')
var sinon = require('sinon')
var Model = require('../../src/js/models/GiveItemModel')
var endpoints = require('../../src/js/api')
var browser = require('../../src/js/browser')

describe('Give Item Model', function () {
  var model
  var browserLoadingStub
  var browserLoadedStub
  var browserTrackEventStub

  describe('Happy Path', function () {
    beforeEach(function () {
      browserLoadingStub = sinon.stub(browser, 'loading')
      browserLoadedStub = sinon.stub(browser, 'loaded')
      browserTrackEventStub = sinon.stub(browser, 'trackEvent')

      model = new Model()
      model.needId = 'abc123'
    })

    afterEach(function () {
      browser.loading.restore()
      browser.loaded.restore()
      browser.trackEvent.restore()
    })

    describe('Submit', function () {
      var postToApiStub

      beforeEach(function () {
        postToApiStub = sinon.stub(postToApi, 'post')
        postToApiStub.returns({
          then: function (success, error) {
            success({
              'status': 'created',
              'statusCode': 201
            })
          }
        })

        browser.loading.reset()
        browser.loaded.reset()

        model.formModel().email('test@test.com')
        model.formModel().message('message')
        model.formModel().isOptedIn(true)

        model.submit()
      })

      afterEach(function () {
        postToApi.post.restore()
      })

      it('should post form to api', function () {
        let endpoint = endpoints.needs + model.needId + '/offers-to-help'
        let payload = {
          'Email': 'test@test.com',
          'Message': 'message',
          'IsOptedIn': true
        }
        expect(postToApiStub
          .withArgs(endpoint, payload).calledOnce).toBeTruthy()
      })

      it('should show user it is loading', function () {
        expect(browserLoadingStub.calledOnce).toBeTruthy()
      })

      it('should show user then that is loaded', function () {
        expect(browserLoadedStub.calledAfter(browserLoadingStub)).toBeTruthy()
      })

      it('should set isFormSubmitSuccessful to true', function () {
        expect(model.isFormSubmitSuccessful()).toBeTruthy()
      })

      it('should set isFormSubmitFailure to false', function () {
        expect(model.isFormSubmitFailure()).toBeFalsy()
      })

      it('should track event', function () {
        expect(browserTrackEventStub.withArgs('give-item-submit-details', 'submit-form', 'success').calledOnce).toBeTruthy()
      })
    })
  })
})
