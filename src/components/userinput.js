import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ApiService from './ApiService.js'
import DatePicker from 'react-datepicker';
import moment from 'moment';
import genAlgo from '../GA.js'
import idb_keyval from 'idb-keyval'
import globalStyles from '../App.css'
import GoogleApiWrapper from './googlemaps.js';
import Loader from './reactloading.js';
import DeleteUserEvent from './deleteUserEvent.js';
import AddUserEvent from './addUserEvent.js';
import MoreInfoButton from './moreInfoButton.js';
import MoreInfoView from './moreInfoView.js';
import EditCostComponent from './editCostComponent.js';
import PaginationLink from './paginationLink.js'
import MultiResultDisplay from './multiResultDisplay.js';
import Message from './message.js';
import ApproxCostToolTip from './approxCostToolTip.js';
import misc from '../miscfuncs/misc.js'
import 'react-datepicker/dist/react-datepicker.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import '../maps.css';
import EmailModal from './emailModal.js';
import Footer from './footer.js';
import TooltipMat from '@material-ui/core/Tooltip';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import DistanceFilter from './filters.js';

import yelp_logo from '../images/yelp_burst.png';
import google_logo from '../images/google_places.png';
import meetup_logo from '../images/meetup_logo.png';
import eventbrite_logo from '../images/eventbrite_logo.png';
import seatgeek_logo from '../images/seatgeek_logo.png';
import globe from '../images/globe.png';
import lock from '../images/lock.png';
import unlock from '../images/unlock.png';
import dark from '../images/dark.png';
import light from '../images/light.png';


import CONSTANTS from '../constants.js'

var geocoder = require('geocoder');

class Userinput extends Component {
  constructor(props) {
    super(props)

    this.state = {
      term: '',
      budgetmax: CONSTANTS.MAX_BUDGET_DEFAULT, // 9999
      budgetmin: CONSTANTS.MIN_BUDGET_DEFAULT, //0
      searchRadius: CONSTANTS.DEFAULT_SEARCH_RADIUS_MI,
      location: 'San Francisco, CA',
      resultsArray: [],
      startDate: moment(),
      savedEvents: [], // actual indices of the user saved events
      eliminatedEvents: [], // indices of the user eliminated itinerary slots (0-6)
      checked: [0, 0, 0, 0, 0, 0, 0], // for displaying checked or unchecked in user saved events
      eliminated: [0, 0, 0, 0, 0, 0, 0], // for displaying checked or unchecked in eliminating itinerary slots
      eventFilterFlags: [1, 1, 1, 1, 1], // ordered left to right: meetup, eventbrite, seatgeek, google places, select/unselect all options
      totalCost: 0,
      itinTimes: [], // time string in AM/PM format for display
      userAddedEvents: [],
      center: {},
      loading: false,
      showMoreInfo: [false, false, false, false, false, false, false],
      message: {},
      allApiData: {}, //this state holds all of the returned api data and is populated from the browser persistent data OR directly from the api calls
      pageNumber: 1,
      foodPageNumber: 1,
      showModal: false,
    };
    this.apiService = new ApiService();
    this.handleChange = this.handleChange.bind(this);
    this.openModal = this.openModal.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCheckbox = this.handleCheckbox.bind(this);
    this.handleEliminate = this.handleEliminate.bind(this);
    this.handleFilter = this.handleFilter.bind(this);
    this.handleExpand = this.handleExpand.bind(this);
    this.handleMoreOptions = this.handleMoreOptions.bind(this);
    this.handleData = this.handleData.bind(this);
    this.handleAddUserEvent = this.handleAddUserEvent.bind(this);
    this.handleDeleteUserEvent = this.handleDeleteUserEvent.bind(this);
    this.handleClearUserEvents = this.handleClearUserEvents.bind(this);
    this.handleMoreInfo = this.handleMoreInfo.bind(this);
    this.handleEventCostChange = this.handleEventCostChange.bind(this);
    this.handleEventPageClick = this.handleEventPageClick.bind(this);
    this.handleFoodPageClick = this.handleFoodPageClick.bind(this);
    this.handleUpdateItinerary = this.handleUpdateItinerary.bind(this);
  }

  handleChange(e) {
    const state = this.state;
    state[e.target.name] = e.target.value;
    this.setState(state);
  }

  handleDateChange(e) {
    this.setState({
      startDate: e
    });
  }

  handleFilter(e) {
    if (e.target.value === "selectAllOption") {
      if (e.target.checked) {
        this.setState({ eventFilterFlags: [1, 1, 1, 1, 1] });
      }
      else {
        this.setState({ eventFilterFlags: [0, 0, 0, 0, 0] });
      }
    }
    else {
      // If the checkbox is checked, add the checkbox index to the states
      let eventFilterFlags = this.state.eventFilterFlags.slice();
      if (e.target.checked) {
        eventFilterFlags[e.target.value] = 1;
        this.setState({ eventFilterFlags: eventFilterFlags });
      }
      // If the checkbox is unchecked, find and remove the checkbox index from the states
      else {
        eventFilterFlags[e.target.value] = 0;
        this.setState({ eventFilterFlags: eventFilterFlags });
      }
    }
  }

  // This function updates the checked state to toggle checkboxes and update which items are "locked" or choosen
  // by the user
  handleCheckbox(e) {
    // i_checkbox is the checkbox value and should only have integer values from 0-6 (e.target.value is a string type though)
    // each checkbox corresponds to an item in the itinerary
    var i_checkbox = parseInt(e.target.value, 10);

    // If the checkbox is checked, add the checkbox index to the states
    let checked = this.state.checked.slice();
    if (e.target.checked) {
      if (!misc.include(this.state.savedEvents, i_checkbox)) { // if i_checkbox is not already in the savedEvents array
        this.state.savedEvents.push(i_checkbox);
      }
      checked[i_checkbox] = 1;
      this.setState({ checked: checked });
    }
    // If the checkbox is NOT checked, find and remove the checkbox index from the states
    else {
      var index = this.state.savedEvents.indexOf(i_checkbox);
      if (index > -1) {
        this.state.savedEvents.splice(index, 1);
        checked[i_checkbox] = 0;
        this.setState({ checked: checked });
      }
    }
  }

  // This function updates the eliminated state to toggle checkboxes and update which items are "nulled"
  // or chosen by the user to be empty (ie none/free itinerary slot)
  handleEliminate(e) {
    // i_checkbox is the checkbox value and should only have integer values from 0-6 (e.target.value is a string type though)
    // each checkbox corresponds to an item in the itinerary
    var i_checkbox = parseInt(e.target.value, 10);

    // If the checkbox is checked, add the checkbox index to the states
    let eliminated = this.state.eliminated.slice();
    if (e.target.checked) {
      if (!misc.include(this.state.eliminatedEvents, i_checkbox)) { // if i_checkbox is not already in the eliminatedEvents array
        this.state.eliminatedEvents.push(i_checkbox);
      }
      eliminated[i_checkbox] = 1;
      var tempNoneObj;
      if (i_checkbox === 1 || i_checkbox === 3 || i_checkbox === 5) {
        tempNoneObj = CONSTANTS.NONE_ITEM;
      }
      else {
        tempNoneObj = CONSTANTS.NONE_ITEM_EVENT;
      }
      tempNoneObj.other = i_checkbox;
      tempNoneObj.cost = 0.0;

      this.handleUpdateItinerary(tempNoneObj);
      this.setState({ eliminated: eliminated });
    }
    // If the checkbox is unchecked, find and remove the checkbox index from the states
    else {
      var index = this.state.eliminatedEvents.indexOf(i_checkbox);
      // from 0 to 6 inclusive
      if (index > -1) {
        this.state.eliminatedEvents.splice(index, 1);
        eliminated[i_checkbox] = 0;
        this.setState({ eliminated: eliminated });
      }
    }
  }

  handleExpand(e) {
    this.setState(prevState => ({
      expanded: !prevState.expanded
    }));
  }

  handleMoreOptions(e) {
    this.setState(prevState => ({
      options: !prevState.options
    }));
  }

  handleData(locations, urls, center) {
    this.setState({
      itinLocations: locations,
      itinUrls: urls,
      center: center
    })
  }

  handleAddUserEvent(userItinSlot, userEventCost, userEventName, userEventTime) {
    // Note: userItinSlot is the string from the dropdown menu in the add user events tab (ie 1-7 only)
    var itinSlot = 1;
    if (userItinSlot) {
      itinSlot = parseInt(userItinSlot, 10); // 1- 7 only
    }
    var cost = 0.0;
    if (userEventCost) {
      cost = parseFloat(userEventCost);
    }

    var time = userEventTime;
    time = time.replace(":", "");
    if (time.localeCompare("") === 0) {
      time = CONSTANTS.EVENT_TIMES[0];
    }

    var userEventRating = CONSTANTS.USERADDED_EVENT_RATING;
    if (itinSlot === 1 || itinSlot === 3 || itinSlot === 5) {
      userEventRating = CONSTANTS.USERADDED_MEAL_RATING;
    }
    var itineraryIndex = itinSlot - 1;
    var userAddedEventObj = {
      name: userEventName,
      url: "",
      rating: userEventRating,
      time: time,
      location: {},
      cost: cost,
      slot: itinSlot, // this is very important! the slot needs to be 1-7 integer
      description: "",
      origin: CONSTANTS.ORIGINS_USER,
      other: itineraryIndex, // this is for handleUpdateItinerary function to auto
                             // put the user added event into the itinerary in the right slot
    }

    this.state.userAddedEvents.push(userAddedEventObj);
    let userAddedEventsArray = this.state.userAddedEvents.slice();
    this.setState({
      userAddedEvents: userAddedEventsArray,
    })

    console.log("User Added: " + userAddedEventObj.name);
    console.log('user state ---->');
    console.log(this.state.userAddedEvents);

    this.handleUpdateItinerary(userAddedEventObj);

  }

  handleDeleteUserEvent(userItinSlot, userEventCost, userEventName) {
    var userAddedEvents = this.state.userAddedEvents;
    var userAddedEventsArray = this.state.userAddedEvents.slice();
    userAddedEvents.find((event, i) => {
      if (event.name === userEventName) {
        userAddedEventsArray.splice(i, 1);
        this.setState({
          userAddedEvents: userAddedEventsArray
        })
      }
    });

    console.log('user state (delete) ---->');
    console.log(this.state.userAddedEvents);
  }

  handleClearUserEvents(e) {

    // clear the saved event/checked slots if they coincide with the user added events
    var itinSlotIndex; // 0-6
    var index;
    var savedEventsState = this.state.savedEvents.slice();
    var checkedState = this.state.checked.slice();
    if (savedEventsState.length > 0) {
      for (var i = 0; i < this.state.userAddedEvents.length; i++) {
        itinSlotIndex = this.state.userAddedEvents[i].slot - 1; // 0-6
        index = savedEventsState.indexOf(itinSlotIndex);
        if (index !== -1) {
          savedEventsState.splice(index, 1); //at index, remove 1 item
          checkedState[itinSlotIndex] = 0; // at slot itinSlotIndex, set to 0 (ie unchecking the box)
        }
        if (savedEventsState.length === 0) {
          break;
        }
      }
    }

    this.setState({
      userAddedEvents: [], // clear all the user added events
      savedEvents: savedEventsState,
      checked: checkedState,
    })
    console.log("All user added events cleared.")
  }

  handleEventPageClick(pageNumber_in) {
    this.setState({
      pageNumber: pageNumber_in,
    })
  }

  handleFoodPageClick(pageNumber_in) {
    this.setState({
      foodPageNumber: pageNumber_in,
    })
  }

  // handles what happens when user selects a event/itinerary item from the comprehensive displayed results
  // to add to the itinerary, or when "x" is clicked or when user adds an event
  handleUpdateItinerary(itinObj_in) {

    // only go through this logic if the itinerary is populated (thus the if statement to check)
    if (this.state.resultsArray.length > 0 && this.state.resultsArray !== null && this.state.resultsArray !== undefined) {
      // Update the total cost displayed
      var i_resultsArray = parseInt(itinObj_in.other); // i_resultsArray is the index position in the itinerary results
                                                       // here, the other field in the other is set by the singleresult component
      var tempTotalCost = this.state.totalCost - this.state.resultsArray[i_resultsArray].cost;
      tempTotalCost = misc.round2NearestHundredth(tempTotalCost + itinObj_in.cost);

      // Update the results array state and the itinTimes state
      this.state.resultsArray[i_resultsArray] = itinObj_in;
      this.state.itinTimes[i_resultsArray] = misc.convertMilTime(itinObj_in.time);

      // If the user selects an event/itinerary item from the results, lock it in the itinerary
      let checked = this.state.checked.slice();
      if (checked[i_resultsArray] !== 1) {
        checked[i_resultsArray] = 1;
        if (!misc.include(this.state.savedEvents, i_resultsArray)) { // if i_resultsArray is not already in the savedEvents array
          this.state.savedEvents.push(i_resultsArray);
        }
      }

      // Update persistent data in browser for GA
      var myStorage = window.localStorage;
      var prevBestItineraryObjs = JSON.stringify({
        Event1: this.state.resultsArray[0],
        Breakfast: this.state.resultsArray[1],
        Event2: this.state.resultsArray[2],
        Lunch: this.state.resultsArray[3],
        Event3: this.state.resultsArray[4],
        Dinner: this.state.resultsArray[5],
        Event4: this.state.resultsArray[6],
      });
      myStorage.setItem("prevBestItinerarySavedObjects", prevBestItineraryObjs);

      // Update states and rerender
      this.setState({
        resultsArray: this.state.resultsArray,
        totalCost: tempTotalCost,
        itinTimes: this.state.itinTimes,
        checked: checked,
        savedEvents: this.state.savedEvents,
      });
    }
  }


  handleMoreInfo(e) {
    var tempShowMoreInfo = (this.state.showMoreInfo).slice();
    tempShowMoreInfo[e] = !tempShowMoreInfo[e];
    this.setState({
      showMoreInfo: tempShowMoreInfo,
    })
  }

  handleEventCostChange(edittedEventCost, edittedEventName, i_resultsArray, edittedEventOrigin) {
    var indexDBcompat = window.indexedDB;
    var myStorage = window.localStorage;

    // edittedEventCost is a float
    if (edittedEventCost !== null &&
      edittedEventCost !== undefined &&
      !isNaN(edittedEventCost) &&
      indexDBcompat && myStorage) {

      i_resultsArray = parseInt(i_resultsArray, 10);
      let checked = this.state.checked.slice();

      // Update the cost of the userAddedEvent in the states if user changes the cost in the itinerary
      if (edittedEventOrigin === CONSTANTS.ORIGINS_USER) {
        var arr = this.state.userAddedEvents;
        var elementPos = misc.findEventObjectByName(arr, edittedEventName); //find match by name
        var tempTotalCost = 0;
        // If match is found, update the cost to whatever the user set
        if (elementPos !== -1) {
          this.state.userAddedEvents[elementPos].cost = edittedEventCost;
          this.state.resultsArray[i_resultsArray].cost = edittedEventCost;

          // save the change in the user-saved objects persistent data
          var bestItineraryObjsParsed = JSON.parse(myStorage.getItem("prevBestItinerarySavedObjects"));
          bestItineraryObjsParsed[CONSTANTS.EVENTKEYS[i_resultsArray]].cost = edittedEventCost;
          myStorage.setItem("prevBestItinerarySavedObjects", JSON.stringify(bestItineraryObjsParsed));

          //Update the totalcost for display
          for (var i = 0; i < CONSTANTS.ITINERARY_SIZE; i++) {
            tempTotalCost = tempTotalCost + parseFloat(this.state.resultsArray[i].cost);
          }
          tempTotalCost = misc.round2NearestHundredth(tempTotalCost);

          this.setState({
            userAddedEvents: this.state.userAddedEvents,
            totalCost: tempTotalCost,
            resultsArray: this.state.resultsArray,
          });

        }
        return; // if the editted event is from the user, no need to do the rest of the function, so return
      }

      if (CONSTANTS.AUTO_LOCK_UPDATED_EVENT) {
        // Auto check the event in the results if the user has updated/editted the cost (as it is assumed they will be interested in that event)
        if (checked[i_resultsArray] !== 1) {
          checked[i_resultsArray] = 1;
        }

        // if the event is not already saved/locked by the user, add it
        if (!misc.include(this.state.savedEvents, i_resultsArray)) { // uses indexof, so MAY have problems with IE
          this.state.savedEvents.push(i_resultsArray);
        }

        // save the change in the user-saved objects persistent data
        var bestItineraryObjsParsed = JSON.parse(myStorage.getItem("prevBestItinerarySavedObjects"));
        bestItineraryObjsParsed[CONSTANTS.EVENTKEYS[i_resultsArray]].cost = edittedEventCost;
        myStorage.setItem("prevBestItinerarySavedObjects", JSON.stringify(bestItineraryObjsParsed));
      }

      // For display only
      var tempTotalCost = this.state.totalCost - this.state.resultsArray[i_resultsArray].cost;
      tempTotalCost = misc.round2NearestHundredth(tempTotalCost + edittedEventCost);
      this.state.resultsArray[i_resultsArray].cost = edittedEventCost;

      this.setState({
        checked: checked,
        resultsArray: this.state.resultsArray,
        totalCost: tempTotalCost,
      });

      // Update persistent api data in browser
      idb_keyval.get('apiData').then(apiData_in => {

        if (apiData_in !== null || apiData_in !== undefined) {

          var apiKey = 'none'; // field/key in the apiData object (ie meetupItemsGlobal,...,yelpDinnerItemsGlobal )
          var arr = []; // event array
          var elementPos = -1; //where the event is matched in the event array

          // apiData_in has following structure:
          // { meetupItemsGlobal, eventbriteGlobal, ... , yelpDinnerItemsGlobal}
          // where
          // { meetupItemsGlobal:{Event1:[...], Event2:[...] , ... , Event4:[...] } }
          // .
          // .
          // .
          // { yelpDinnerItemsGlobal:[{Obj1}, ..., {Objn}]
          if (edittedEventOrigin.localeCompare(CONSTANTS.ORIGINS_EB) === 0) {
            apiKey = CONSTANTS.APIKEYS[0];
          }
          else if (edittedEventOrigin.localeCompare(CONSTANTS.ORIGINS_GP) === 0) {
            apiKey = CONSTANTS.APIKEYS[1];
          }
          else if (edittedEventOrigin.localeCompare(CONSTANTS.ORIGINS_MU) === 0) {
            apiKey = CONSTANTS.APIKEYS[2];
          }
          else if (edittedEventOrigin.localeCompare(CONSTANTS.ORIGINS_SG) === 0) {
            apiKey = CONSTANTS.APIKEYS[3];
          }
          else if (edittedEventOrigin.localeCompare(CONSTANTS.ORIGINS_YELP) === 0) {
            if (i_resultsArray === 1) {
              apiKey = CONSTANTS.APIKEYS[4];
            }
            else if (i_resultsArray === 3) {
              apiKey = CONSTANTS.APIKEYS[5];
            }
            else if (i_resultsArray === 5) {
              apiKey = CONSTANTS.APIKEYS[6];
            }
          }

          if (apiKey.localeCompare('none') !== 0) {
            if (edittedEventOrigin.localeCompare(CONSTANTS.ORIGINS_YELP) === 0) {
              arr = apiData_in[apiKey];
            }
            else {
              arr = apiData_in[apiKey][CONSTANTS.EVENTKEYS[i_resultsArray]];
            }

            // Find the index within the proper array of event objects that has an event name that matches with
            // edittedEventName
            elementPos = misc.findEventObjectByName(arr, edittedEventName);
            // If match is found, update the cost to whatever the user set
            if (elementPos !== -1) {
              if (edittedEventOrigin.localeCompare(CONSTANTS.ORIGINS_YELP) === 0) {
                apiData_in[apiKey][elementPos].cost = edittedEventCost;
              }
              else {
                apiData_in[apiKey][CONSTANTS.EVENTKEYS[i_resultsArray]][elementPos].cost = edittedEventCost;
              }
            }
          }

          return apiData_in;
        }
        else {
          return -1;
        }
      }, function (err) {
        return err;
      }).catch(err => console.log('Error updating the cost handleEventCostChange!', err))
        .then(apiDataCostUpdated => {

          // Everything is good and updated, now restore the api data in the browser
          if (apiDataCostUpdated !== -1) {
            idb_keyval.set('apiData', apiDataCostUpdated)
              .then(function (e) {
                this.setState({
                  allApiData: apiDataCostUpdated,
                })
              }.bind(this))
              .catch(err => console.log('It failed!', err));
          }

        }, function (err) {
          return err;
        }).catch(err => console.log('Error setting the new api data with updated cost in handleEventCostChange!', err));
    }
  }

  openModal() {
    this.emailModal.openModal();
  }

  handleSubmit(e) {
    e.preventDefault();

    console.clear();
    // Handle empty budget inputs
    if (!this.state.budgetmax || this.state.budgetmax === NaN || this.state.budgetmax === undefined) {
      this.setState({
        budgetmax: CONSTANTS.MAX_BUDGET_DEFAULT,
      })
    }
    if (!this.state.budgetmin || this.state.budgetmin === NaN || this.state.budgetmax === undefined) {
      this.setState({
        budgetmin: CONSTANTS.MIN_BUDGET_DEFAULT,
      })
    }

    //Handle empty search radius input
    if (!this.state.searchRadius || this.state.searchRadius === NaN || this.state.searchRadius === undefined) {
      this.setState({
        searchRadius: CONSTANTS.DEFAULT_SEARCH_RADIUS_MI,
      })
    }

    var insideBudget = true;
    if (this.state.resultsArray.length > 1) {
      var arrayOfCosts = [this.state.resultsArray[0].cost,
                          this.state.resultsArray[1].cost,
                          this.state.resultsArray[2].cost,
                          this.state.resultsArray[3].cost,
                          this.state.resultsArray[4].cost,
                          this.state.resultsArray[5].cost,
                          this.state.resultsArray[6].cost]
      var maxCostIndex = misc.findMaxValueInArray(arrayOfCosts);

      if (this.state.checked[maxCostIndex] === 1) {
        if (arrayOfCosts[maxCostIndex] > this.state.budgetmax) {

          var messageStrObj = {
            textArray: CONSTANTS.LOCKED_EVENT_EXCEEDS_BUDGET,
            boldIndex: -1
          };
          this.setState({
            message: messageStrObj,
          });
          insideBudget = false;
          return;
        }
      }
      else if (this.state.totalCost > this.state.budgetmax ||
       this.state.totalCost < this.state.budgetmin) {
        insideBudget = false;
        return;
      }
    }

    this.setState({
      loading: true
    });
    var myStorage = window.localStorage;
    var doAPICallsFlag = true;
    var indexDBcompat = window.indexedDB;

    // Determine if the API data needs to be cleared locally (every 24 hours)
    var clearApiData = clearLocallyStoredAPIData(myStorage);
    if (clearApiData) {
      idb_keyval.delete('apiData');
      console.log('Clearing API Data!!')
    }


    // Check if state startDate is defined
    if (this.state.startDate) {

      // Convert the moment obj from the user input into a date object in javascript
      var date = this.state.startDate.toDate(); // This does not change if the date selected in the UI does change
      // It is fixed to the timestamp at the first time the date is selected in the UI.
      var today = moment();


      if (isDate(date)) {
        //console.log(date)

        // Geocoding to convert user location input into lat/lon
        geocoder.geocode(this.state.location, function (err, data_latlon) {

          if (data_latlon) {
            if (data_latlon.results && data_latlon.results.length > 0 && insideBudget) {

              // Construct lat/long string from geocoder from user input
              var lat = data_latlon.results[0].geometry.location.lat;
              var lon = data_latlon.results[0].geometry.location.lng;
              var locationLatLong = lat + ',' + lon;
              var mapCenter = {
                lat: data_latlon.results[0].geometry.location.lat,
                lng: data_latlon.results[0].geometry.location.lng
              };

              // Do reverse geocode to get the city from the lat long (for seat geek api call)
              // this offers robustness to the user input for the location
              geocoder.reverseGeocode(lat, lon, function (err, data_city) {
                if (data_city) {
                  if (data_city.results) {

                    var dataLength = data_city.results.length;
                    var city = this.state.location;

                    // find the city portion of the data
                    for (var i = 0; i < dataLength; i++) {
                      if (data_city.results[i].types) {
                        if (data_city.results[i].types[0] === "locality") {
                          if (data_city.results[i].address_components) {
                            city = data_city.results[i].address_components[0].long_name;
                            break;
                          }
                        }
                      }
                    }

                    // Determine whether or not API calls need to be made
                    console.log("search radius: " + this.state.searchRadius);
                    doAPICallsFlag = determineAPICallBool(myStorage, this.state.startDate, today, locationLatLong, this.state.searchRadius);

                    if (doAPICallsFlag || clearApiData || !indexDBcompat) {
                      // Reset API data cached timestamp
                      resetAPIDataTimeStampToNow(myStorage);

                      console.log("Do API calls!!!")
                      // Do API requests and return a promise object to display results
                      var promiseObj = this.apiService.getData(this.state.term,
                        locationLatLong,
                        city,
                        date,
                        date.toString(),
                        this.state.searchRadius);
                      promiseObj.then(function (data) {

                        // Set saved events to empty because if an API call is needed, this means
                        // the event data has changed. It doesn't make sense to use the previously
                        // saved events selected by the user.
                        var savedEvents = [];
                        var eliminatedEvents = [];
                        var bestItineraryObjsParsed = [];

                        // Preprocess data for genetic algo
                        var dataForGA = processAPIDataForGA(data.data,
                          this.state.eventFilterFlags,
                          savedEvents,
                          bestItineraryObjsParsed,
                          this.state.userAddedEvents);

                        // Do optimization to find locally "best" itinerary
                        var optimItinerary = genAlgo.doGA(dataForGA, this.state.budgetmax, this.state.budgetmin, eliminatedEvents);

                        // Construct output for display (array of objects in correct itinerary order)
                        var resultsArrayOutput = [dataForGA[0].Event1[optimItinerary.bestItineraryIndices[0]], //Event 1
                        dataForGA[1].Breakfast[optimItinerary.bestItineraryIndices[1]], //Breakfast
                        dataForGA[2].Event2[optimItinerary.bestItineraryIndices[2]],//Event 2
                        dataForGA[3].Lunch[optimItinerary.bestItineraryIndices[3]], //Lunch
                        dataForGA[4].Event3[optimItinerary.bestItineraryIndices[4]],//Event 3
                        dataForGA[5].Dinner[optimItinerary.bestItineraryIndices[5]], //Dinner
                        dataForGA[6].Event4[optimItinerary.bestItineraryIndices[6]]];//Event 4

                        if (optimItinerary.bestItineraryIndices[0] === -1) { // No itinerary was found/ error occurred

                          // reset stuff
                          resultsArrayOutput[0] = CONSTANTS.EMPTY_ITINERARY;
                          resultsArrayOutput.splice(1,6);

                          var messageStrObj = {
                            textArray: CONSTANTS.NO_ITINERARIES_FOUND_TEXT,
                            boldIndex: -1
                          };

                          this.setState({
                            resultsArray: resultsArrayOutput,
                            checked: [0, 0, 0, 0, 0, 0, 0], //reset the checkboxes to being unchecked
                            eliminated: [0, 0, 0, 0, 0, 0, 0], //reset the checkboxes for the eliminated slots
                            // totalCost: optimItinerary.totalCost,
                            savedEvents: [],
                            eliminatedEvents: [],
                            itinTimes: [],
                            totalCost: 0,
                            loading: false,
                            showMoreInfo: [false, false, false, false, false, false, false],
                            message: messageStrObj,
                            allApiData: data.data,
                            pageNumber: 1,
                            foodPageNumber: 1,
                          });
                        }
                        else { // GA produced an optimal itinerary. Display results
                          // create array for the time to be displayed for each itinerary item
                          var timesOutput = [misc.convertMilTime(resultsArrayOutput[0].time),
                          misc.convertMilTime(resultsArrayOutput[1].time),
                          misc.convertMilTime(resultsArrayOutput[2].time),
                          misc.convertMilTime(resultsArrayOutput[3].time),
                          misc.convertMilTime(resultsArrayOutput[4].time),
                          misc.convertMilTime(resultsArrayOutput[5].time),
                          misc.convertMilTime(resultsArrayOutput[6].time)];

                          // Output data to map
                          this.handleData(optimItinerary.bestLocations, optimItinerary.bestUrls, mapCenter);

                          var messageStrObj = {
                            textArray: ["The max event cost is "
                              , "$" + optimItinerary.maxCost.toString(),
                              ". Increase your budget to include more events!"],
                            boldIndex: 1
                          };

                          // Set the state in this component and re-render
                          this.setState({
                            resultsArray: resultsArrayOutput,
                            itinTimes: timesOutput,
                            savedEvents: savedEvents,
                            checked: [0, 0, 0, 0, 0, 0, 0], //reset the checkboxes to being unchecked
                            eliminated: [0, 0, 0, 0, 0, 0, 0], //reset the checkboxes for the eliminated slots
                            eliminatedEvents: eliminatedEvents,
                            totalCost: optimItinerary.totalCost,
                            loading: false,
                            showMoreInfo: [false, false, false, false, false, false, false],
                            message: messageStrObj,
                            allApiData: data.data,
                            pageNumber: 1,
                            foodPageNumber: 1,
                          });

                          this.setState(prevState => ({
                            expanded: !prevState.expanded
                          }));

                          // Save the user saved events into persistent memory client side
                          var prevBestItineraryObjs = JSON.stringify({
                            Event1: dataForGA[0].Event1[optimItinerary.bestItineraryIndices[0]],
                            Breakfast: dataForGA[1].Breakfast[optimItinerary.bestItineraryIndices[1]],
                            Event2: dataForGA[2].Event2[optimItinerary.bestItineraryIndices[2]],
                            Lunch: dataForGA[3].Lunch[optimItinerary.bestItineraryIndices[3]],
                            Event3: dataForGA[4].Event3[optimItinerary.bestItineraryIndices[4]],
                            Dinner: dataForGA[5].Dinner[optimItinerary.bestItineraryIndices[5]],
                            Event4: dataForGA[6].Event4[optimItinerary.bestItineraryIndices[6]],
                          });

                          myStorage.setItem("prevBestItinerarySavedObjects", prevBestItineraryObjs);
                        }

                        // Put the data returned from API calls (yelp, meetup, etc) into the client's browser
                        // for persistent storage
                        if (indexDBcompat) {
                          idb_keyval.set('apiData', data.data)
                            .then(function (e) {
                              idb_keyval.get('apiData').then(val => console.log(val));
                            })
                            .catch(err => console.log('It failed!', err));
                        }

                      }.bind(this), function (err) {
                        return err;
                      }).catch(function (e) {
                        this.setState({
                          loading: false,
                          resultsArray: [],
                        });
                        myStorage.clear();
                        console.log(e)
                      }.bind(this)); //end then

                    }
                    // No need to do the API calls from yelp, meetup, etc because inputs (date and location)
                    // have not changed.
                    else {
                      console.log("No need to do API calls!!!")

                      if (indexDBcompat && insideBudget) {
                        idb_keyval.get('apiData').then(val => {

                          // Save the previously saved events by the user as persistent data in
                          // client side as a string
                          var savedEvents = [];
                          if (this.state.savedEvents.length > 0 && null !== myStorage.getItem('prevBestItinerarySavedObjects')) {
                            var bestItineraryObjsParsed = JSON.parse(myStorage.getItem("prevBestItinerarySavedObjects"));
                            savedEvents = this.state.savedEvents.map(Number);
                          }

                          // Get which itinerary items/events are eliminated and not used in the GA (ie the user wants the
                          // item/event set to "none/free itinerary item")
                          var eliminatedEvents = this.state.eliminatedEvents.map(Number);

                          // Preprocess data for genetic algo
                          var dataForGA = processAPIDataForGA(val,
                            this.state.eventFilterFlags,
                            savedEvents,
                            bestItineraryObjsParsed,
                            this.state.userAddedEvents);

                          // Do optimization to find locally "best" itinerary
                          var optimItinerary = genAlgo.doGA(dataForGA, this.state.budgetmax, this.state.budgetmin, eliminatedEvents);

                          // Construct output for display (aray of objects in correct itinerary order)
                          var resultsArrayOutput = [dataForGA[0].Event1[optimItinerary.bestItineraryIndices[0]], //Event 1
                          dataForGA[1].Breakfast[optimItinerary.bestItineraryIndices[1]], //Breakfast
                          dataForGA[2].Event2[optimItinerary.bestItineraryIndices[2]],//Event 2
                          dataForGA[3].Lunch[optimItinerary.bestItineraryIndices[3]], //Lunch
                          dataForGA[4].Event3[optimItinerary.bestItineraryIndices[4]],//Event 3
                          dataForGA[5].Dinner[optimItinerary.bestItineraryIndices[5]], //Dinner
                          dataForGA[6].Event4[optimItinerary.bestItineraryIndices[6]]];//Event 4

                          if (optimItinerary.bestItineraryIndices[0] === -1) { // No itinerary was found/ error occurred

                            // reset stuff
                            resultsArrayOutput[0] = CONSTANTS.EMPTY_ITINERARY;
                            resultsArrayOutput.splice(1,6);

                            var messageStrObj = {
                              textArray: CONSTANTS.NO_ITINERARIES_FOUND_TEXT,
                              boldIndex: -1
                            };

                            this.setState({
                              resultsArray: resultsArrayOutput,
                              checked: [0, 0, 0, 0, 0, 0, 0], //reset the checkboxes to being unchecked
                              eliminated: [0, 0, 0, 0, 0, 0, 0], //reset the checkboxes for the eliminated slots
                              // totalCost: optimItinerary.totalCost,
                              savedEvents: [],
                              eliminatedEvents: [],
                              itinTimes: [],
                              totalCost: 0,
                              loading: false,
                              showMoreInfo: [false, false, false, false, false, false, false],
                              message: messageStrObj,
                              allApiData: val,
                            });
                          }
                          else { // GA produced an optimal itinerary. Display results
                            // Save the user saved events into persistent memory client side
                            var prevBestItineraryObjs = JSON.stringify({
                              Event1: dataForGA[0].Event1[optimItinerary.bestItineraryIndices[0]],
                              Breakfast: dataForGA[1].Breakfast[optimItinerary.bestItineraryIndices[1]],
                              Event2: dataForGA[2].Event2[optimItinerary.bestItineraryIndices[2]],
                              Lunch: dataForGA[3].Lunch[optimItinerary.bestItineraryIndices[3]],
                              Event3: dataForGA[4].Event3[optimItinerary.bestItineraryIndices[4]],
                              Dinner: dataForGA[5].Dinner[optimItinerary.bestItineraryIndices[5]],
                              Event4: dataForGA[6].Event4[optimItinerary.bestItineraryIndices[6]],
                            });

                            // create array for the time to be displayed for each itinerary item
                            var timesOutput = [misc.convertMilTime(resultsArrayOutput[0].time),
                            misc.convertMilTime(resultsArrayOutput[1].time),
                            misc.convertMilTime(resultsArrayOutput[2].time),
                            misc.convertMilTime(resultsArrayOutput[3].time),
                            misc.convertMilTime(resultsArrayOutput[4].time),
                            misc.convertMilTime(resultsArrayOutput[5].time),
                            misc.convertMilTime(resultsArrayOutput[6].time)];

                            myStorage.setItem("prevBestItinerarySavedObjects", prevBestItineraryObjs);

                            this.handleData(optimItinerary.bestLocations, optimItinerary.bestUrls, mapCenter);
                            var messageStrObj = {
                              textArray: ["The max event cost is "
                                , "$" + optimItinerary.maxCost.toString(),
                                ". Increase your budget to include more events!"],
                              boldIndex: 1
                            };


                            // Set the state in this component and re-render
                            this.setState({
                              resultsArray: resultsArrayOutput,
                              itinTimes: timesOutput,
                              totalCost: optimItinerary.totalCost,
                              loading: false,
                              showMoreInfo: [false, false, false, false, false, false, false],
                              message: messageStrObj,
                              allApiData: val,
                            });
                          }

                        }
                        );
                      }
                    }
                  }
                }
            }.bind(this), { key: process.env.REACT_GOOGLE_API_KEY })

            }
            else {
              this.setState({
                loading: false,
              });
              console.log(data_latlon)
              console.log("invalid location input!")
            } // end if (data_latlon.results)
          }
          else {
            this.setState({
              loading: false,
            });
          }
      }.bind(this), { key: process.env.REACT_GOOGLE_API_KEY })
      }
    }
  }

  render() {
    var formStyles = ['form-body'];
    var optionStyles = ['more-options', 'form-body'];
    const ITINCONTAINER_STYLE = 'itinContainer';
    const HIDDEN = 'hidden';
    const OPEN = 'open';

    var origins = {
      yelp: yelp_logo,
      places: google_logo,
      meetup: meetup_logo,
      eventbrite: eventbrite_logo,
      seatgeek: seatgeek_logo
    }
    var ITINERARY_LENGTH = this.state.resultsArray.length;
    const { term, budgetmax, budgetmin, location } = this.state;
    var indents = [];

    if(this.state.resultsArray.length > 0) {
        indents.push(<thead key="tablehead">
        <tr>
            <th colSpan="7"><h4>Your Itinerary</h4></th>
        </tr>
    </thead>);
        // Form the itinerary results display
        for (var i = 0; i < ITINERARY_LENGTH; i++) {
          var origin = this.state.resultsArray[i].origin;
          var moreInfoStyles = [];
          moreInfoStyles.push(ITINCONTAINER_STYLE);

        if (!this.state.showMoreInfo[i]) {
          moreInfoStyles.push(HIDDEN);
        }
        var lock_icon = lock
        if (!this.state.checked[i]) {
          lock_icon = unlock;
        }

        var elim_icon = light
        if (!this.state.eliminated[i]) {
          elim_icon = dark;
        }

        var key = 'tbody-' + i;
        var id = 'checkbox-' + i;
        var elim_id = 'elim-' + i;
        indents.push(
          <tbody key={key}>
            <tr>
              <td><a href={this.state.resultsArray[i].url} ><img className="origin-logo" alt="" src={origins[origin]} /></a></td>
              <td><strong>{this.state.itinTimes[i] ? this.state.itinTimes[i] : ''}</strong></td>
              <td className="resultsName">
                {this.state.resultsArray[i].url === "" ? this.state.resultsArray[i].name :
                  <a href={this.state.resultsArray[i].url} target='_blank'>{this.state.resultsArray[i].name} </a>}
                {/* {this.state.resultsArray[i].origin === 'noneitem' || this.state.resultsArray[i].origin === CONSTANTS.ORIGINS_USER ? '' : <MoreInfoButton value={i} onButtonClick={this.handleMoreInfo} />} */}
              </td>
              <td className="edit-cost text-success"><EditCostComponent
                name={this.state.resultsArray[i].name}
                cost={this.state.resultsArray[i].cost}
                handleCostChange={this.handleEventCostChange}
                i_resultsArray={i}
                origin={this.state.resultsArray[i].origin} />

                 </td>
                 <td><ApproxCostToolTip
                 approxCostFlag={this.state.resultsArray[i].approximateFee}
                 origin={this.state.resultsArray[i].origin}/></td>
              <td>
                <label htmlFor={id}>
                <TooltipMat placement="top" title={CONSTANTS.LOCK_TOOLTIP_STR}>
                <img alt="lock icon" className="lock" src={lock_icon} />
                </TooltipMat>
                </label>
                <input className="lock_checkbox" id={id} checked={this.state.checked[i]} onChange={this.handleCheckbox} type="checkbox" value={i} />
                </td>
              <td>
                <label htmlFor={elim_id}>
                <TooltipMat placement="top" title={CONSTANTS.X_TOOLTIP_STR}>
                <img alt="eliminate icon" className="elim" src={elim_icon} />
                </TooltipMat>
                </label>
                <input className="elim_checkbox" id={elim_id} checked={this.state.eliminated[i]} onChange={this.handleEliminate} type='checkbox' value={i} />

                </td>
            </tr>
            <tr className={moreInfoStyles.join(' ')}>
              <td colSpan="8"><MoreInfoView desc={this.state.resultsArray[i].description}
                phone={this.state.resultsArray[i].phone}
                address={this.state.resultsArray[i].address}
                duration={this.state.resultsArray[i].duration}
                otherInfo={this.state.resultsArray[i].other}
                origin={this.state.resultsArray[i].origin}
                thumbnail={this.state.resultsArray[i].thumbnail}
                url={this.state.resultsArray[i].url}
                approxFeeFlag={this.state.resultsArray[i].approximateFee}
                defaultDurationFlag={this.state.resultsArray[i].defaultDuration} /></td>
            </tr>
          </tbody>
        );
      }

      // The Total cost display
      var messageObject;
      var totalCostDisplayed;
      if (this.state.totalCost > this.state.budgetmax) {
        messageObject = {
          textArray: CONSTANTS.EXCEEDED_BUDGET_TEXT,
          boldIndex: 0,
        }
        totalCostDisplayed = <font color="red"><b>${this.state.totalCost}</b></font>;
      }
      else if (this.state.totalCost < this.state.budgetmin) {
        messageObject = {
          textArray: CONSTANTS.LESS_THAN_MINBUDGET_TEXT,
          boldIndex: 0,
        }
        totalCostDisplayed = <font color="red"><b>${this.state.totalCost}</b></font>;
      }
      else {
        messageObject = this.state.message;
        totalCostDisplayed = <b>${this.state.totalCost}</b>;
      }
      if (this.state.resultsArray.length > 0) {
        var total = [];
        total.push(<div key="totalCostDiv">
          <table>
            <tbody>
              <tr>
                <td className="costStr">
                  <strong>Approx. Total Cost:</strong>
                </td>
                <td className="cost">
                  {totalCostDisplayed}
                </td>
              </tr>


              {this.state.message === -1 ? '' :
                <tr><td colSpan="2">
                  <Message key={"messageComponent"} messageObj={messageObject} />
                </td></tr>
              }
            </tbody>
          </table>
        </div>)

        var goAgainButton = [];

        goAgainButton.push(
          <table key={"go-button-table"}>
            <tbody>
              <tr>
              <td className="sendEmail">
                  <EmailModal location={this.state.location} totalCost={this.state.totalCost} resultsArray={this.state.resultsArray} onRef={ref => (this.emailModal = ref)}/>
                  <TooltipMat placement="top" title={CONSTANTS.EMAIL_TOOLTIP_STR}>
                  <input className="block btn btn-sm btn-primary go-btn" type="button" value="Send Me the Itinerary" onClick={this.openModal}/>
                  </TooltipMat>
              </td>
                <td className="itinGoBtn">
                <TooltipMat placement="top" title={CONSTANTS.SEARCHAGAIN_TOOLTIP_STR}>
                  <input className="btn btn-sm go-btn" type="submit" onClick={this.handleSubmit} value="Search Again!" />
                  </TooltipMat>
                </td>
              </tr>
            </tbody>
          </table>
        );
      }
    }

    // More options display
    var options = [];
    var filters = [];
    var filterNames = CONSTANTS.FILTER_NAMES;
    var filterDesc = CONSTANTS.FILTER_DESC;
    options.push(<li className="filter" key="eventFilterFlags">
      <input checked={this.state.eventFilterFlags[CONSTANTS.NUM_EVENT_APIS]} onChange={this.handleFilter} type='checkbox' value='selectAllOption' /> Select All</li>)
    options.push(<li key="alleventsdesc" className="filterDesc">Use events from all services.</li>);
    for (i = 0; i < CONSTANTS.NUM_EVENT_APIS; i++) {
      var event = 'event-' + i;
      var desc = 'desc-' + i;
      options.push(<li className="filter" key={event}>
        <input checked={this.state.eventFilterFlags[i]} onChange={this.handleFilter} type='checkbox' value={i} /> {filterNames[i]}</li>
      );
      options.push(<li key={desc}><p className="filterDesc">{filterDesc[i]}</p></li>);
    }

    var userevents = [];
    for (i = 0; i < this.state.userAddedEvents.length; i++) {
      userevents.unshift(<DeleteUserEvent key={key} userevent={this.state.userAddedEvents[i]} handleDelete={this.handleDeleteUserEvent} />);
    }


    // Event Pagination
    var pages = [];
    var pageNumber;
    if (!misc.isObjEmpty(this.state.allApiData)) {
      countEventApiDataForFilter(this.state.allApiData,
      this.state.eventFilterFlags,
      CONSTANTS.DEFAULT_MAX_TIME_4_DISPLAY,CONSTANTS.DEFAULT_MIN_TIME_4_DISPLAY,
      CONSTANTS.DEFAULT_MAX_PRICE_4_DISPLAY,CONSTANTS.DEFAULT_MIN_PRICE_4_DISPLAY);

      var numPages = Math.floor(this.state.allApiData.numDataPoints.numOfEvents / CONSTANTS.NUM_RESULTS_PER_PAGE) + 1;
      pages.push("<");

      for (i = 0; i < numPages; i++) {
        pageNumber = i + 1;
        if (this.state.pageNumber !== pageNumber) {
          pages.push(<PaginationLink key={"pg" + pageNumber} pageNumber={pageNumber} onPageLinkClick={this.handleEventPageClick} />);
        }
        else {
          pages.push(pageNumber);
        }
      }
      pages.push(">");
    }

    var eventsMultiResults = [];
    if (!misc.isObjEmpty(this.state.allApiData)) {
      eventsMultiResults = [this.state.allApiData.eventbriteGlobal,
      this.state.allApiData.googlePlacesGlobal,
      this.state.allApiData.meetupItemsGlobal,
      this.state.allApiData.seatgeekItemsGlobal];
    }

    // Food Pagination
    var foodPages = [];
    var foodPageNumber;
    if (!misc.isObjEmpty(this.state.allApiData)) {
      var numPages = Math.floor(this.state.allApiData.numDataPoints.numOfFoodPlaces / CONSTANTS.NUM_RESULTS_PER_PAGE) + 1;
      foodPages.push("<");

      for (i = 0; i < numPages; i++) {
        foodPageNumber = i + 1;
        if (this.state.foodPageNumber !== foodPageNumber) {
          foodPages.push(<PaginationLink key={"pg" + foodPageNumber} pageNumber={foodPageNumber} onPageLinkClick={this.handleFoodPageClick} />);
        }
        else {
          foodPages.push(foodPageNumber);
        }
      }
      foodPages.push(">");
    }

    var foodMultiResults = [];
    if (!misc.isObjEmpty(this.state.allApiData)) {
      foodMultiResults = [this.state.allApiData.yelpBreakfastItemsGlobal,
      this.state.allApiData.yelpLunchItemsGlobal,
      this.state.allApiData.yelpDinnerItemsGlobal];
    }

    const styles = {
      root: {
        flexGrow: 1,
      },
      flex: {
        flexGrow: 1,
      },
      menuButton: {
        marginLeft: -12,
        marginRight: 20,
      },
    };



    return (
      <div className="Userinput">
          <div className={styles.root}>
            <AppBar position="static">
              <Toolbar>
                <IconButton className={styles.menuButton} color="inherit" aria-label="Menu">
                  <MenuIcon />
                </IconButton>
                <Typography variant="title" color="inherit" className={styles.flex}>
                  Blue Planit
                </Typography>
                <form onSubmit={this.handleSubmit}>
                  <div>
                    <div className="row inputsRow">
                      <div className="col-md-4 form-group mb-2">
                      <TooltipMat placement="bottom" title={CONSTANTS.LOCATION_TOOLTIP_STR}>
                        <input required id="location" className="textInput" type="text" name="location" /*value={location}*/ onChange={this.handleChange} autoComplete="address-level2" placeholder="Where are you going?" />
                        </TooltipMat>
                      </div>
                      <div className="col-md-2 form-group mb-2 datePickerWrapper">
                        <DatePicker required id="datePicker" className="textInput" selected={this.state.startDate} onChange={this.handleDateChange} minDate={CONSTANTS.TODAYDATE}  />
                      </div>
                      <div className="col-md-2 form-group mb-2">
                        <input /*required*/ className="textInput" type="number" min="0" name="searchRadius" /*value={50}*/ onChange={this.handleChange} placeholder="Search Radius (mi)" />
                      </div>
                      <div className="col-md-2 form-group mb-2">
                      <TooltipMat placement="bottom" title={CONSTANTS.MIN_TOOLTIP_STR}>
                        <input /*required*/ className="textInput" type="number" min="0" name="budgetmin" /*value={budgetmin}*/ onChange={this.handleChange} placeholder="$ Min" />
                        </TooltipMat>
                      </div>
                      <div className="col-md-2 form-group mb-2">
                      <TooltipMat placement="bottom" title={CONSTANTS.MAX_TOOLTIP_STR}>
                        <input /*required*/ className="textInput" min="0" type="number" name="budgetmax" /*value={budgetmax}*/ onChange={this.handleChange} placeholder="$ Max" />
                        </TooltipMat>
                      </div>
                      <div className="col-md-2 search-btn">
                      <TooltipMat placement="bottom" title={CONSTANTS.GO_TOOLTIP_STR}>
                            <Button variant="contained" color="secondary" type="submit">
                                    GO!
                            </Button>
                            </TooltipMat>
                      </div>
                    </div>
                  </div>
                </form>
              </Toolbar>
            </AppBar>
          </div>
        {/* <Filters/> */}
        <div className="filters-div">
            <DistanceFilter></DistanceFilter>
        </div>

        {/* All data gets shown here (api data, and user added data) */}
        <div className="nav nav-tabs" id="nav-tab" role="tablist">
          <a className="nav-item nav-link active" id="nav-events-tab" data-toggle="tab" href="#nav-events" role="tab" aria-controls="nav-events" aria-selected="true">Events and Places</a>
          <a className="nav-item nav-link" id="nav-food-tab" data-toggle="tab" href="#nav-food" role="tab" aria-controls="nav-food" aria-selected="false"> Restaurants</a>
          <a className="nav-item nav-link" id="nav-add-tab" data-toggle="tab" href="#nav-add" role="tab" aria-controls="nav-add" aria-selected="false"> Add Event</a>
        </div>

        <div className="row eventsCont apidata">
          <div className="tab-content col-md-7 itinerary">
            <div className="itinerary tab-pane fade show active" id="nav-events" role="tabpanel" aria-labelledby="nav-options-tab">

              {<MultiResultDisplay apiData={eventsMultiResults}
                displayCategory={1} //events
                pageNumber={this.state.pageNumber}
                AddUserSelectedEventFromDisplayedResults={this.handleUpdateItinerary}
                minPrice={CONSTANTS.DEFAULT_MIN_PRICE_4_DISPLAY}
                maxPrice={CONSTANTS.DEFAULT_MAX_PRICE_4_DISPLAY}
                maxTime={CONSTANTS.DEFAULT_MAX_TIME_4_DISPLAY}
                minTime={CONSTANTS.DEFAULT_MIN_TIME_4_DISPLAY}
                eventFilterFlags={this.state.eventFilterFlags}/>}
              {pages}

            </div>

            <div className="itinerary tab-pane fade" id="nav-food" role="tabpanel" aria-labelledby="nav-options-tab">
              {<MultiResultDisplay apiData={foodMultiResults}
                displayCategory={0} //restaurants
                pageNumber={this.state.foodPageNumber}
                AddUserSelectedEventFromDisplayedResults={this.handleUpdateItinerary}
                minPrice={CONSTANTS.DEFAULT_MIN_PRICE_4_DISPLAY}
                maxPrice={CONSTANTS.DEFAULT_MAX_PRICE_4_DISPLAY}
                maxTime={CONSTANTS.DEFAULT_MAX_TIME_4_DISPLAY}
                minTime={CONSTANTS.DEFAULT_MIN_TIME_4_DISPLAY}
                eventFilterFlags={this.state.eventFilterFlags}/>}
            {foodPages}
            </div>


            <div className="tab-pane fade" id="nav-add" role="tabpanel" aria-labelledby="nav-add-tab">
                <h5>Add Your Own Event:</h5>
                <AddUserEvent handleAdd={this.handleAddUserEvent} />
              {/* clear all user added events*/}
              <a href="javascript:void(0)" onClick={this.handleClearUserEvents}> Clear All Added Events
                          </a>
              {<MultiResultDisplay apiData={this.state.userAddedEvents}
                displayCategory={2} //user added events
                pageNumber={this.state.foodPageNumber}
                AddUserSelectedEventFromDisplayedResults={this.handleUpdateItinerary}
                minPrice={CONSTANTS.DEFAULT_MIN_PRICE_4_DISPLAY}
                maxPrice={CONSTANTS.DEFAULT_MAX_PRICE_4_DISPLAY}
                maxTime={CONSTANTS.DEFAULT_MAX_TIME_4_DISPLAY}
                minTime={CONSTANTS.DEFAULT_MIN_TIME_4_DISPLAY}
                eventFilterFlags={this.state.eventFilterFlags}/>}
                {/* {userevents} */}
            </div>
          </div>
          <div className="mapsfix itinerary col-md-5">
            {this.state.resultsArray.length === 0 && this.state.loading === false ? <div className="greeting"><h4>Get Started Planning Your Trip / Day Above!</h4><img alt="globe" src={globe}></img></div> : ' '}
            {this.state.loading === true ? <div className="loader"><Loader type="spinningBubbles" color="#6c757d"></Loader><h5>Searching...</h5></div> :

              <table>
                {indents}
              </table>}

            {this.state.loading === false ? <div className="totalCost">
              {total}
            </div> : ''}

            {this.state.loading === false ? <div>
              {goAgainButton}</div>
              : ''}

            {/*<GoogleApiWrapper results={this.state.resultsArray} center={this.state.center} />*/}
          </div>

        </div>
        <div >
        {<Footer/>}
          </div>
      </div>

    )
  }
}

// Check for a valid date from the user input
function isDate(d) {
  if (Object.prototype.toString.call(d) === "[object Date]") {
    // it is a date
    if (isNaN(d.getTime())) {  // d.valueOf() could also work
      // date is not valid
      return 0;
    }
    else {
      // date is valid
      return 1;
    }
  }
  else {
    // not a date
    return 0;
  }
}

// Returns true if locally stored data is "stale" or user input a different location therefore new API calls
// need to be made
function determineAPICallBool(myStorage_in, date_in, today_in, latLon_in, radius_in) {
  if (myStorage_in) { //} && indexDBcompat_in) {

    var isToday;
    if (date_in.toDate().getDate() === today_in.toDate().getDate()) {
      if (date_in.toDate().getMonth() === today_in.toDate().getMonth()) {
        if (date_in.toDate().getFullYear() === today_in.toDate().getFullYear()) {
          isToday = true;
          console.log("Today is the same date as input")
        }
      }
    }
    else {
      console.log("Today is NOT the same date as input")
      isToday = false;
    }

    //Check Date and time
    var dateTimeIsStale = false;
    if (isToday) {
      // If the field localStoredDateTime is NOT null, check if it's old
      if (null !== myStorage_in.getItem('localStoredDateTime')) {
        var locStoredDateTimeStr = myStorage_in.getItem('localStoredDateTime');
        var localStoredTimeMoment = moment(locStoredDateTimeStr);
        if (xHoursPassed(today_in, locStoredDateTimeStr, 2)) {
          // Yes, 2 hours have passed. Reset the localStoredDateTime to the current time
          myStorage_in.setItem('localStoredDateTime', today_in.format());
          dateTimeIsStale = true;
        }
        else if ((today_in.toDate().getDate() !== localStoredTimeMoment.toDate().getDate()) ||
          (today_in.toDate().getMonth() !== localStoredTimeMoment.toDate().getMonth()) ||
          (today_in.toDate().getFullYear() !== localStoredTimeMoment.toDate().getFullYear())) {

          myStorage_in.setItem('localStoredDateTime', today_in.format());
          dateTimeIsStale = true;
        }
      }
      // If the field localStoredDateTime is null, set it equal to current time
      else {
        myStorage_in.setItem('localStoredDateTime', today_in.format());
        dateTimeIsStale = true;
      }
    }
    else {
      if (null !== myStorage_in.getItem('localStoredDateTime')) {
        var localStoredTimeMoment = moment(myStorage_in.getItem('localStoredDateTime'));
        if ((date_in.toDate().getDate() !== localStoredTimeMoment.toDate().getDate()) ||
          (date_in.toDate().getMonth() !== localStoredTimeMoment.toDate().getMonth()) ||
          (date_in.toDate().getFullYear() !== localStoredTimeMoment.toDate().getFullYear())) {

          console.log("date: " + date_in.toDate().getDate() + "/" + date_in.toDate().getMonth() + "/" + date_in.toDate().getFullYear())
          console.log("loca: " + localStoredTimeMoment.toDate().getDate() + "/" + localStoredTimeMoment.toDate().getMonth() + "/" + localStoredTimeMoment.toDate().getFullYear())
          myStorage_in.setItem('localStoredDateTime', date_in.format());
          dateTimeIsStale = true;
        }
      }
      else {
        myStorage_in.setItem('localStoredDateTime', date_in.format());
        dateTimeIsStale = true;
      }
    }

    //Check lat lon
    var latLonIsDifferent = false;
    // If the field localStoredLatLon is NOT null, check if it's different from the current lat lon input from user
    if (null !== myStorage_in.getItem('localStoredLatLon')) {
      if ((myStorage_in.getItem('localStoredLatLon')).localeCompare(latLon_in) !== 0) { // 0 indicates the strings are exact matches
        myStorage_in.setItem('localStoredLatLon', latLon_in);
        latLonIsDifferent = true;
      }
    }
    // If the field localStoredLatLon is null, set it equal to current lat lon location
    else {
      myStorage_in.setItem('localStoredLatLon', latLon_in);
      latLonIsDifferent = true;
    }

    //Check search radius (for different search radii, the api data needs to be retreived again because some apis don't have location data)
    var radiusIsDifferent = false;
    // If the field localStoredRadius is NOT null, check if it's different from the current lat lon input from user
    if (null !== myStorage_in.getItem('localStoredRadius')) {
      if ((myStorage_in.getItem('localStoredRadius')).localeCompare(radius_in) !== 0) { // 0 indicates the strings are exact matches
        myStorage_in.setItem('localStoredRadius', radius_in);
        radiusIsDifferent = true;
      }
    }
    // If the field localStoredRadius is null, set it equal to current lat lon location
    else {
      myStorage_in.setItem('localStoredRadius', radius_in);
      radiusIsDifferent = true;
    }


    // Return the proper flag
    if (dateTimeIsStale || latLonIsDifferent || radiusIsDifferent) {
      return true; // do the API calls!
    }
    else {
      return false; // don't the API calls because data is already stored locally and a previous
      // API call was made
    }
  }
  else {
    return true; // do the API calls!
  }
}


// Determine if the locally stored time stamp (which is a string produced by a moment using the format() method)
// is older than X amount of hours compared to the current time. If so, return true. Else false
function xHoursPassed(currentDateTimeMoment, locallyStoredDateTimeStr, elapsedHours) {
  var locStoredDateTimePlusXHours = moment(locallyStoredDateTimeStr).add(elapsedHours, 'hours');
  return currentDateTimeMoment.isAfter(locStoredDateTimePlusXHours.format());
}


function processAPIDataForGA(events_in, eventFilterFlags_in, savedEvents_in,
  savedEventsObjs_in, userAddedEventsObjs_in) {
  try {
    // Define whether or not user choose to save an event or restaurant to eat at
    // savedEvents_in is the indices of the saved events [0-6]
    // savedEventsObj_in is that actual data of the event/restaurant (name, url, cost, etc)
    var savedUserInputs = false;
    if (savedEvents_in.length > 0 && savedEventsObjs_in) {
      savedUserInputs = true;
    }

    var userAddedEventsFlag = false;
    if (userAddedEventsObjs_in.length > 0 && userAddedEventsObjs_in) {
      userAddedEventsFlag = true;
    }

    // Assigning to some variables
    var meetupItemsGlobal = events_in.meetupItemsGlobal;
    var yelpEventsGlobal = events_in.yelpEventsGlobal;
    var eventbriteGlobal = events_in.eventbriteGlobal;
    var seatgeekItemsGlobal = events_in.seatgeekItemsGlobal;
    var googlePlacesGlobal = events_in.googlePlacesGlobal;
    var yelpBreakfastItemsGlobal = events_in.yelpBreakfastItemsGlobal;
    var yelpLunchItemsGlobal = events_in.yelpLunchItemsGlobal;
    var yelpDinnerItemsGlobal = events_in.yelpDinnerItemsGlobal;

    // Determine how many data points there are
    var numDataPointsObj = events_in.numDataPoints;
    var numMeetupEvents = numDataPointsObj.numMeetupEvents;
    var numYelpEvents = numDataPointsObj.numYelpEvents;
    var numEventbriteEvents = numDataPointsObj.numEventbriteEvents;
    var numSeatgeekEvents = numDataPointsObj.numSeatgeekEvents;
    var numGooglePlaces = numDataPointsObj.numGooglePlaces;

    console.log("num meetup events: " + numMeetupEvents);
    console.log("num yelp events: " + numYelpEvents);
    console.log("num eb events: " + numEventbriteEvents);
    console.log("num sg events: " + numSeatgeekEvents);
    console.log("num goog places: " + numGooglePlaces);

    // Flags to include certain API data in the GA. Currently yelpEvents is hard-coded to false and google
    // places is to true and the rest is selected by the user (default for be true)
    var includeMeetupEvents = eventFilterFlags_in[0];
    var includeYelpEvents = false;
    var includeEventbriteEvents = eventFilterFlags_in[1];
    var includeSeatgeekEvents = eventFilterFlags_in[2];
    var includeGooglePlaces = eventFilterFlags_in[3];

    // Initialize array that will be returned and formatted for the GA
    var itineraries = [ //array of objects with one key per object. the key holds another array of objects
      { Event1: [] }, // 0
      { Breakfast: [] }, //1
      { Event2: [] }, //2
      { Lunch: [] }, //3
      { Event3: [] }, //4
      { Dinner: [] }, //5
      { Event4: [] }, //6
    ];

    // Begin formatting and preprocess data
    itineraries[1].Breakfast = yelpBreakfastItemsGlobal.slice();

    itineraries[3].Lunch = yelpLunchItemsGlobal.slice();

    itineraries[5].Dinner = yelpDinnerItemsGlobal.slice();

    // Concat meetup events to itineraries array
    if (includeMeetupEvents) {
      if (meetupItemsGlobal.Event1.length >= 1) {
        itineraries[0].Event1 = itineraries[0].Event1.concat(meetupItemsGlobal.Event1);
      }
      if (meetupItemsGlobal.Event2.length >= 1) {
        itineraries[2].Event2 = itineraries[2].Event2.concat(meetupItemsGlobal.Event2);
      }
      if (meetupItemsGlobal.Event3.length >= 1) {
        itineraries[4].Event3 = itineraries[4].Event3.concat(meetupItemsGlobal.Event3);
      }
      if (meetupItemsGlobal.Event4.length >= 1) {
        itineraries[6].Event4 = itineraries[6].Event4.concat(meetupItemsGlobal.Event4);
      }
    }

    // Concat yelp events to itineraries array
    if (includeYelpEvents) {
      if (yelpEventsGlobal.Event1.length >= 1) {
        itineraries[0].Event1 = itineraries[0].Event1.concat(yelpEventsGlobal.Event1);
      }
      if (yelpEventsGlobal.Event2.length >= 1) {
        itineraries[2].Event2 = itineraries[2].Event2.concat(yelpEventsGlobal.Event2);
      }
      if (yelpEventsGlobal.Event3.length >= 1) {
        itineraries[4].Event3 = itineraries[4].Event3.concat(yelpEventsGlobal.Event3);
      }
      if (yelpEventsGlobal.Event4.length >= 1) {
        itineraries[6].Event4 = itineraries[6].Event4.concat(yelpEventsGlobal.Event4);
      }
    }

    // Concat eventbrite events to itineraries array
    if (includeEventbriteEvents) {
      if (eventbriteGlobal.Event1.length >= 1) {
        itineraries[0].Event1 = itineraries[0].Event1.concat(eventbriteGlobal.Event1);
      }
      if (eventbriteGlobal.Event2.length >= 1) {
        itineraries[2].Event2 = itineraries[2].Event2.concat(eventbriteGlobal.Event2);
      }
      if (eventbriteGlobal.Event3.length >= 1) {
        itineraries[4].Event3 = itineraries[4].Event3.concat(eventbriteGlobal.Event3);
      }
      if (eventbriteGlobal.Event4.length >= 1) {
        itineraries[6].Event4 = itineraries[6].Event4.concat(eventbriteGlobal.Event4);
      }
    }

    // Concat seatgeek events to itineraries array
    if (includeSeatgeekEvents) {
      if (seatgeekItemsGlobal.Event1.length >= 1) {
        itineraries[0].Event1 = itineraries[0].Event1.concat(seatgeekItemsGlobal.Event1);
      }
      if (seatgeekItemsGlobal.Event2.length >= 1) {
        itineraries[2].Event2 = itineraries[2].Event2.concat(seatgeekItemsGlobal.Event2);
      }
      if (seatgeekItemsGlobal.Event3.length >= 1) {
        itineraries[4].Event3 = itineraries[4].Event3.concat(seatgeekItemsGlobal.Event3);
      }
      if (seatgeekItemsGlobal.Event4.length >= 1) {
        itineraries[6].Event4 = itineraries[6].Event4.concat(seatgeekItemsGlobal.Event4);
      }
    }

    // Concat google places to itineraries array
    if (includeGooglePlaces) {
      if (googlePlacesGlobal.Event1.length >= 1) {
        itineraries[0].Event1 = itineraries[0].Event1.concat(googlePlacesGlobal.Event1);
      }
      if (googlePlacesGlobal.Event2.length >= 1) {
        itineraries[2].Event2 = itineraries[2].Event2.concat(googlePlacesGlobal.Event2);
      }
      if (googlePlacesGlobal.Event3.length >= 1) {
        itineraries[4].Event3 = itineraries[4].Event3.concat(googlePlacesGlobal.Event3);
      }
      if (googlePlacesGlobal.Event4.length >= 1) {
        itineraries[6].Event4 = itineraries[6].Event4.concat(googlePlacesGlobal.Event4);
      }
    }

    // Append a "none" itinerary item at the end of each key array
    itineraries[1].Breakfast.push(CONSTANTS.NONE_ITEM);
    itineraries[3].Lunch.push(CONSTANTS.NONE_ITEM);
    itineraries[5].Dinner.push(CONSTANTS.NONE_ITEM);

    itineraries[0].Event1.push(CONSTANTS.NONE_ITEM_EVENT);
    itineraries[2].Event2.push(CONSTANTS.NONE_ITEM_EVENT);
    itineraries[4].Event3.push(CONSTANTS.NONE_ITEM_EVENT);
    itineraries[6].Event4.push(CONSTANTS.NONE_ITEM_EVENT);

    // Save user added event by overwriting previous assignments
    console.log("user added events array:")
    console.log(userAddedEventsObjs_in)
    if (userAddedEventsFlag) {

      var doOnce = [true, true, true, true, true, true, true];
      var itinSlot = 1;
      for (var iadded = 0; iadded < userAddedEventsObjs_in.length; iadded++) {
        itinSlot = userAddedEventsObjs_in[iadded].slot; // should be 1-7 from dropdown menu in "add event" tab
        itinSlot = itinSlot - 1; // shift down one for indexing
        if (doOnce[itinSlot]) {
          // if user has added an event in a particular itinerary slot, delete all data in that slot
          // delete itineraries[itinSlot][CONSTANTS.EVENTKEYS[itinSlot]]; // (ie if itinSlot = 0 -> itineraries[0].Event1)
          // itineraries[itinSlot][CONSTANTS.EVENTKEYS[itinSlot]] = [];  // (ie if itinslot = 1 -> itineraries[1].Breakfast = [];)
          doOnce[itinSlot] = false;
        }
        // after the previous api data was deleted, push all the user added events in a particular slot
        itineraries[itinSlot][CONSTANTS.EVENTKEYS[itinSlot]].push(userAddedEventsObjs_in[iadded]); // (ie if itinSlot = 2 -> itineraries[2].Event2.push(userAddedEventsObjs_in[iadded]);)
      }
    }

    // Save certain itinerary events/items (from API calls) based on user input by overwriting previous assignments
    console.log("saved events array:")
    console.log(savedEvents_in)
    if (savedUserInputs) {
      var itinSlot = 1;
      for (var isaved = 0; isaved < savedEvents_in.length; isaved++) {
        itinSlot = savedEvents_in[isaved]; // indices 0-6
        delete itineraries[itinSlot][CONSTANTS.EVENTKEYS[itinSlot]]; // (ie if itinslot = 0 -> delete itineraries[0].Event1;)
        itineraries[itinSlot][CONSTANTS.EVENTKEYS[itinSlot]] = []; // (ie if itinslot = 1 -> itineraries[1].Breakfast =[];)
        itineraries[itinSlot][CONSTANTS.EVENTKEYS[itinSlot]][0] = savedEventsObjs_in[CONSTANTS.EVENTKEYS[itinSlot]]; // (ie if itinslot = 3 -> itineraries[3].Lunch[0] = savedEventsObjs_in.Lunch;)
      }
    }

    return itineraries;
  }
  catch (e) {
    console.log('error in processAPIDataForGA')
    console.log(e)
    return [ //array of objects with one key per object. the key holds another array of objects
      { Event1: [] }, // 0
      { Breakfast: [] }, //1
      { Event2: [] }, //2
      { Lunch: [] }, //3
      { Event3: [] }, //4
      { Dinner: [] }, //5
      { Event4: [] }, //6
    ];
  }
}

// This function returns a flag to clear or not to clear the locally stored API data depending on if the data has been
// stored for 24 hours or not. This is for API terms and conditions compliance to ensure data is not cached longer
// than 24 hours.
function clearLocallyStoredAPIData(myStorage_in) {
  var currentTimeStamp = new Date();
  var currentTimeStampStr = currentTimeStamp.getTime().toString(); // ms
  var currentTimeStampMilSec = currentTimeStamp.getTime();

  var clearApiData = false;
  if (myStorage_in) {
    var lastLocalTimeStampForAPIDataDeletion = myStorage_in.getItem('timestamp');
    // There is no timestamp key in local storage, create it and set it to the current time
    if (lastLocalTimeStampForAPIDataDeletion === null || !lastLocalTimeStampForAPIDataDeletion) {
      myStorage_in.setItem('timestamp', currentTimeStampStr);
    }
    // If there is the timestamp key in local storage, compare it to the current time and calculate
    // if the difference is greater than 24 hours ago
    else {
      var prevTimeStamp = parseInt(lastLocalTimeStampForAPIDataDeletion, 10);
      if (currentTimeStampMilSec - prevTimeStamp >= CONSTANTS.TWENTYFOUR_HOURS) {
        clearApiData = true;
        myStorage_in.setItem('timestamp', currentTimeStampStr);
      }
    }
  }
  return clearApiData;
}

function resetAPIDataTimeStampToNow(myStorage_in) {
  var currentTimeStamp = new Date();
  var currentTimeStampStr = currentTimeStamp.getTime().toString(); // ms
  myStorage_in.setItem('timestamp', currentTimeStampStr);
}


function countEventApiDataForFilter(allApiData, apiSource, maxTime, minTime, maxPrice, minPrice) {
  var filteredEventCount = 0;
  for (var i = 0; i < CONSTANTS.NUM_OF_EVENT_APIS; i++) { // cycle through meetup -> google places
    for (var j = 0; j < CONSTANTS.NUM_OF_EVENT_SLOTS; j++) { // cycle through event1 -> event4 itinerary slots (j=[0 1 2 3] maps to j*2=[0 2 4 6] -> CONSTANTS.EVENTKEYS)
      var eventObj = allApiData[CONSTANTS.APIKEYS[i]][CONSTANTS.EVENTKEYS[j * 2]];
      var lenEvents = eventObj.length;
      for (var iEvent = 0; iEvent < lenEvents; iEvent++) {
        // apiSource is an array of 1s or 0s and is from userinput state eventFilterFlags 
        // ordered left to right: meetup, eventbrite, seatgeek, google places, select/unselect all options       
        const reducer = (accumulator, currentValue) => accumulator + currentValue;
        var apiSourceLength = apiSource.length;
        var EVENTS_ORIGINS_ARRAY = [
          CONSTANTS.ORIGINS_MU,
          CONSTANTS.ORIGINS_EB,
          CONSTANTS.ORIGINS_SG,
          CONSTANTS.ORIGINS_GP
        ]; // same order as apiSource (order matters)

        // Check if in price range
        if (parseFloat(eventObj.cost) < minPrice || parseFloat(eventObj.cost) > maxPrice) {
          // Check if in time range
          if (parseFloat(eventObj.time) < minTime || parseFloat(eventObj.time) > maxTime) {
            
            // Check if itinerary obj is from a selected api source (ie if meetup is checked, check that this itinerary object is a meetup obj)
            if (apiSource[apiSourceLength - 1] === 0) { // if not all apiSources are selected
              if (apiSource.reduce(reducer) === 0) { // none of the apiSources are selected
                break;
              }
              for (var i = 0; i < apiSourceLength - 1; i++) {
                if (apiSource[i] === 1) {
                  if (EVENTS_ORIGINS_ARRAY[i].localeCompare(eventObj.origins) === 0) {
                    filteredEventCount++;
                    break;
                  }
                }
              }
            }
            

          }
        }

      }
    }
  }
   return filteredEventCount;
}

Userinput.propTypes = {}

Userinput.defaultProps = {}

export default Userinput;
