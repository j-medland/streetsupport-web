// Common modules
import './common'

// Page modules
var urlParameter = require('./get-url-parameter')
var accordion = require('./accordion')

// Lodash
var forEach = require('lodash/collection/forEach')
var sortBy = require('lodash/collection/sortBy')
var slice = require('lodash/array/slice')
var findIndex = require('lodash/array/findIndex')

var apiRoutes = require('./api')
var getApiData = require('./get-api-data')
var categoryEndpoint = require('./category-endpoint')
var templating = require('./template-render')
var Spinner = require('spin.js')
var analytics = require('./analytics')
var socialShare = require('./social-share')

function getLocation () {
  var location = urlParameter.parameter('location')
  var savedLocationCookie = document.cookie.replace(/(?:(?:^|.*;\s*)desired-location\s*\=\s*([^;]*).*$)|^.*$/, '$1')
  if (savedLocationCookie.length && location.length === 0) return savedLocationCookie
  if (location === 'my-location') return ''
    return location
}

function buildListener (categoryKey, subCategoryKey) {
  return {
    accordionOpened: function (element, context) {
      var subCategoryId = element.getAttribute('id')
      history.pushState({}, '', 'category-by-day.html?category=' + categoryKey + '&' + subCategoryKey + '=' + subCategoryId)
    }
  }
}

function setTitle (categoryName) {
  document.title = categoryName + ' - Street Support'
}

function handleSubCategoryChange(subCategoryKey, accordion) {
  window.onpopstate = function () {
    var subCategory = urlParameter.parameterFromString(document.location.search, subCategoryKey)
    var el = document.getElementById(subCategory)
    var context = document.querySelector('.js-accordion')
    var useAnalytics = true

    accordion.reOpen(el, context, useAnalytics)
  }
}

var spin = document.getElementById('spin')
var loading = new Spinner().spin(spin)

var theCategory = urlParameter.parameter('category')
var theLocation = getLocation()
var dayToOpen = urlParameter.parameter('day')

var categoryUrl = apiRoutes.categoryServiceProvidersByDay += theCategory
categoryEndpoint.getEndpointUrl(categoryUrl, theLocation).then(function (success) {
  buildList(success)
}, function (error) {
})

function buildList (url) {
  // Get API data using promise
  getApiData.data(url).then(function (result) {
    var data = result.data

    setTitle(data.categoryName)

    // Append object name for Hogan
    var template = ''
    var callback = function () {}

    if (data.daysServices.length) {
      template = 'js-category-result-tpl'

      data.daysServices = sortByOpeningTimes(sortDaysFromToday(data.daysServices))

      forEach(data.daysServices, function (subCat) {
        forEach(subCat.serviceProviders, function (provider) {
          if (provider.tags !== null) {
            provider.tags = provider.tags.join(', ')
          }
        })
      })

      var dayIndexToOpen = findIndex(data.daysServices, function(day) {
        return day.name === dayToOpen
      })

      callback = function () {
        accordion.init(true, dayIndexToOpen, buildListener(theCategory, 'day'))
      }
    } else {
      template = 'js-category-no-results-result-tpl'
    }

    var hasSetManchesterAsLocation = theLocation === 'manchester'

    handleSubCategoryChange('day', accordion)

    var theData = {
      organisations: data,
      pageAsFromManchester: 'category-by-day.html?category=' + theCategory + '&location=manchester',
      pageFromCurrentLocation: 'category-by-day.html?category=' + theCategory + '&location=my-location',
      useManchesterAsLocation: hasSetManchesterAsLocation,
      useGeoLocation: !hasSetManchesterAsLocation
    }
    templating.renderTemplate(template, theData, 'js-category-result-output', callback)

    loading.stop()
    analytics.init(theTitle)
    socialShare.init()
  })
}

function sortByOpeningTimes (days) {
  forEach(days, function (day) {
    day.serviceProviders = sortBy(day.serviceProviders, function (provider) {
      return provider.openingTime.startTime
    })
  })
  return days
}

function sortDaysFromToday (days) {
  // api days: monday == 0!
  var today = new Date().getDay() - 1
  var past = slice(days, 0, today)
  var todayToTail = slice(days, today)
  return todayToTail.concat(past)
}
