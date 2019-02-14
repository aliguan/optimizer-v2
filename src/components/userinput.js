import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ApiService from './ApiService.js'
import DatePicker from 'react-datepicker';
import moment from 'moment';
import genAlgo from '../GA.js'
import idb_keyval from 'idb-keyval'
import GoogleApiWrapper from './googlemaps.js';
import Loader from './reactloading.js';
import DeleteUserEvent from './deleteUserEvent.js';
import ItineraryCard from './itineraryCard.js';
import MiniItineraryCard from './miniItineraryCard.js';
import ItinerarySummary from './itinerarySummary.js';
import PaginationLink from './paginationLink.js'
import MultiResultDisplay from './multiResultDisplay.js';
import MoreOptions from './moreOptions';
import MapBoxComponent from './mapBoxComponent';
import Message from './message.js';
import misc from '../miscfuncs/misc.js'
import 'react-datepicker/dist/react-datepicker.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import '../maps.css';
import Footer from './footer.js';
import TooltipMat from '@material-ui/core/Tooltip';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import yelp_logo from '../images/yelp_burst.png';
import google_logo from '../images/google_places.png';
import meetup_logo from '../images/meetup_logo.png';
import eventbrite_logo from '../images/eventbrite_logo.png';
import seatgeek_logo from '../images/seatgeek_logo.png';
import AllFilters from './allFilters';

import CONSTANTS from '../constants.js';
import DescDialog from './descDialog.js'
import LocationErrorDialog from './locationErrorDialog.js'
import Icon from "@material-ui/core/Icon/Icon";
import EmailModal from "./emailModal";

//https://developers.google.com/maps/documentation/geocoding/usage-and-billing
//0-100k queries = $5 per 1k queries
var geocoder = require('geocoder');

class Userinput extends Component {
    constructor(props) {
        super(props);

        this.state = {
            term: '',
            budgetmax: CONSTANTS.MAX_BUDGET_DEFAULT, // 9999
            budgetmin: CONSTANTS.MIN_BUDGET_DEFAULT, //0
            searchRadius: CONSTANTS.DEFAULT_SEARCH_RADIUS_MI,
            location: 'San Francisco, CA',
            resultsArray: [],
            startDate: '',
            savedEvents: [], // actual indices of the user saved events
            eliminatedEvents: [], // indices of the user eliminated itinerary slots (0-6)
            checked: [0, 0, 0, 0, 0, 0, 0], // for displaying checked or unchecked in user saved events
            eliminated: [0, 0, 0, 0, 0, 0, 0], // for displaying checked or unchecked in eliminating itinerary slots
            totalCost: 0,
            itinTimes: [], // time string in AM/PM format for display
            userAddedEvents: [],
            loading: false,
            showMoreInfo: [false, false, false, false, false, false, false],
            message: {},
            allApiData: {}, //this state holds all of the returned api data and is populated from the browser persistent data OR directly from the api calls
            filteredApiData: {},
            pageNumber: 1,
            foodPageNumber: 1,
            showModal: false,
            tabState: CONSTANTS.NAV_EVENT_TAB_ID,
            cityName: '',
            showDetailedItinerary: true,

            //Map states
            center: {},
            mapItinCardHoverStates: {
                showMarker: false,
                iHover: 0, //ith itinerary item to show marker info when the card is hovered over
            },

            //Settings
            userFoodCost: 0, // a blanket cost set to food defined by the user in the settings/more options function
            userEventCost: 0, // a blanket cost set to events defined by the user in the settings/more options function
            eventType: 0, // index used to map to a search term for events (see EVENTTYPE_SEARCHKEYS in constants)

            // filter states
            filterRadius: CONSTANTS.DEFAULT_SEARCH_RADIUS_MI,
            searchRadiusForFilterCompare: CONSTANTS.DEFAULT_SEARCH_RADIUS_MI, // this only changes when handlesubmit is called
            priceFilterRange: [CONSTANTS.DEFAULT_PRICEFILTER_MIN, CONSTANTS.DEFAULT_PRICEFILTER_MAX],
            timeFilterRange: [CONSTANTS.DEFAULT_TIMEFILTER_MIN, CONSTANTS.DEFAULT_TIMEFILTER_MAX],
            mealFilterFlags: [true, true, true, true], // [breakfast,lunch,dinner,all]
            eventFilterFlags: [1, 1, 1, 1, 1], // ordered left to right: meetup, eventbrite, seatgeek, google places, select/unselect all options
            apiCalls: true,

            mapOrResultsState: 'maps',

            //Event description
            descDialogOpen: [false, false, false, false, false, false, false],

            //Homepage Form -- revisit
            homepageFormClasses: ['homepageForm', 'extended-search-input', 'fade'],

            //mouse click
            clickedDiv: '',
            searchInputWidth: 0,

            //Filters
            openFilters: false,
        };
        this.apiService = new ApiService();
        this.handleChange = this.handleChange.bind(this);
        this.handleDateChange = this.handleDateChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleCheckbox = this.handleCheckbox.bind(this);
        this.handleEliminate = this.handleEliminate.bind(this);
        this.handleApiFilter = this.handleApiFilter.bind(this);
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
        this.handleFilterRadius = this.handleFilterRadius.bind(this);
        this.handleTabState = this.handleTabState.bind(this);
        this.handleSearchRadius = this.handleSearchRadius.bind(this);
        this.handlePriceFilter = this.handlePriceFilter.bind(this);
        this.handleTimeFilter = this.handleTimeFilter.bind(this);
        this.handleMealFilter = this.handleMealFilter.bind(this);
        this.handleResetFilter = this.handleResetFilter.bind(this);
        this.handleUpdateUserFoodCost = this.handleUpdateUserFoodCost.bind(this);
        this.handleUpdateUserEventCost = this.handleUpdateUserEventCost.bind(this);
        this.handleUpdateEventTypeSearch = this.handleUpdateEventTypeSearch.bind(this);
        this.handleClickDescOpen = this.handleClickDescOpen.bind(this);
        this.handleClickDescClose = this.handleClickDescClose.bind(this);
        this.handleShowItin = this.handleShowItin.bind(this);
        this.handleShowMap = this.handleShowMap.bind(this);
        this.handleMoveItinItemUp = this.handleMoveItinItemUp.bind(this);
        this.handleMoveItinItemDown = this.handleMoveItinItemDown.bind(this);
        this.handleItinCardMouseEnter = this.handleItinCardMouseEnter.bind(this);
        this.handleItinCardMouseLeave = this.handleItinCardMouseLeave.bind(this);
        this.handleMouseClick = this.handleMouseClick.bind(this);
        this.updateDimensions = this.updateDimensions.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.handleToggleItinerary = this.handleToggleItinerary.bind(this);
        //global variables
        this.locationCheckResult = 0; // only set by misc.checkIfValidLocation function,
                                      // 0 = valid location, 1 = invalid location (outside of supported countries), 2 = invalid location input
    }

    //updates width of extended search bar form when resizing page
    updateDimensions() {
        var width = this.searchIconNode.clientWidth + this.searchInputNode.clientWidth;
        this.setState({searchInputWidth: width});
    }

    handleToggleItinerary() {
        console.clear()
        console.log("handletoggleitin")
        this.setState({
            showDetailedItinerary: !this.state.showDetailedItinerary,
        })
    }

    //listens to click on search input on fixed nav
    handleMouseClick(event) {
        if(this.node.contains(event.target)) {
            return;
        } else {
            this.handleOutsideClick();
        }
    }

    //handles what happens when mouse enters itin card
    handleItinCardMouseEnter(e) {
        e = parseInt(e, 10)
        var tempObj = {
            showMarker: true,
            iHover: e,
        }
        this.setState({
            mapItinCardHoverStates: tempObj,
        });
    }

    //handles what happens when mouse leaves itin card
    handleItinCardMouseLeave(e) {
        e = parseInt(e, 10)
        var tempObj = {
            showMarker: false,
            iHover: e,
        }
        this.setState({
            mapItinCardHoverStates: tempObj,
        });
    }

    //handles click outside of fixed nav search bar
    handleOutsideClick() {
        var homepageClasses = this.state.homepageFormClasses;
        var index = homepageClasses.indexOf('show');
        if(index !== -1) {
            homepageClasses.splice(index, 1);
            this.setState({
                homepageFormClasses: homepageClasses,
            });
        }
    }
    handleTabState(e) {
        this.setState({
            tabState: e.target.id, // Sets tabState to string (ie CONSTANTS.NAV_EVENT_TAB_ID)
        });
    }

    handleChange(e) {
        const state = this.state;
        state[e.target.name] = e.target.value;
        this.setState(state);
    }

    // handleFormClick(e) {
    //     this.setState({
    //         homepageFormClasses: ['extendedFormShow'],
    //         homepageInputClasses: ['homepage', 'homepageLocInput', 'extended'],
    //         searchIconClasses: ['searchIcon', 'searchIconExtended'],
    //         widthExtended: this.whereToRef.current.offsetWidth + this.searchIconRef.current.offsetWidth,
    //     },console.log(this.state.widthExtended));
    // }

    handleSearchRadius(e) {
        var searchRadiusInput = parseFloat(e.target.value);
        if (isNaN(searchRadiusInput)) {
            searchRadiusInput = CONSTANTS.DEFAULT_SEARCH_RADIUS_MI;
        }
        this.setState({
            searchRadius: searchRadiusInput,
        })
    }

    handleDateChange(e) {
        this.setState({
            startDate: e
        });
    }

    handleFilterRadius(distance) {
        distance = parseFloat(distance);
        console.log('distance passed in', distance);
        this.setState({
            filterRadius: distance, // max radius [miles]
            pageNumber: 1,
            foodPageNumber: 1,
        },console.log('i am the radisu', this.state.filterRadius));
    }

    // Returned filter data from the api filter
    handleApiFilter(e) {
        this.setState({
            eventFilterFlags: e, // array of 1s and 0s indicating which api sources are selected (order matters)
            pageNumber: 1,
            foodPageNumber: 1,
        });
    }

    // Returned filter data from the meal filter
    handleMealFilter(e) {
        this.setState({
            mealFilterFlags: e, // array of true/false flags [breakfast lunch dinner all
            foodPageNumber: 1,
        });
    }

    // Returned filter data from the price filter
    handlePriceFilter(e) {
        this.setState({
            priceFilterRange: e, //[min max]
            pageNumber: 1,
            foodPageNumber: 1,
        });
    }

    handleTimeFilter(e) {
        this.setState({
            timeFilterRange: e, //[min max]
            pageNumber: 1,
        });
    }

    // This function resets the filters when the api calls occur
    handleResetFilter() {
        this.setState({
            apiCalls: false,
        });
    }

    // This function handles the state updates for when the "move up" button is pressed in an itinerary item
    handleMoveItinItemUp(e) {
        var ith_itinItem = parseInt(e.target.value, 10); //position of the item being moved in the itinerary (0-6)
        let resultsArray = this.state.resultsArray.slice();
        let newSavedEvents = this.state.savedEvents.slice();
        let newEliminatedEvents = this.state.eliminatedEvents.slice();
        var indexRemove;

        if (ith_itinItem > 0 && ith_itinItem !== null && ith_itinItem !== undefined) {

            var validMove = true;
            // check that the item can be moved up
            if (resultsArray[ith_itinItem].time.localeCompare(CONSTANTS.FOODTIME_STR) !== 0
                && resultsArray[ith_itinItem].origin.localeCompare(CONSTANTS.ORIGINS_NONE) !== 0) {
                if (resultsArray[ith_itinItem - 1].time.localeCompare(CONSTANTS.FOODTIME_STR) !== 0
                    && resultsArray[ith_itinItem - 1].origin.localeCompare(CONSTANTS.ORIGINS_NONE) !== 0) {
                    validMove = false;
                }
            }

            if (validMove) {
                var tempItinItemObj_Down = resultsArray[ith_itinItem - 1];
                tempItinItemObj_Down.other = ith_itinItem;
                this.state.resultsArray[ith_itinItem] = tempItinItemObj_Down;
                this.state.itinTimes[ith_itinItem] = misc.convertMilTime(tempItinItemObj_Down.time);

                var tempItinItemObj_Up = resultsArray[ith_itinItem];
                tempItinItemObj_Up.other = ith_itinItem - 1;
                this.state.resultsArray[ith_itinItem - 1] = tempItinItemObj_Up;
                this.state.itinTimes[ith_itinItem - 1] = misc.convertMilTime(tempItinItemObj_Up.time);

                // Swap the "checked" state to show a locked or unlocked icon
                var tempNewState = this.state.checked[ith_itinItem];
                this.state.checked[ith_itinItem] = this.state.checked[ith_itinItem - 1];
                this.state.checked[ith_itinItem - 1] = tempNewState;

                // Swap the "eliminated" state to show a canceled or plus icon
                tempNewState = this.state.eliminated[ith_itinItem];
                this.state.eliminated[ith_itinItem] = this.state.eliminated[ith_itinItem - 1];
                this.state.eliminated[ith_itinItem - 1] = tempNewState;

                // Correctly update the savedEvents state (indices of the itinerary that are "locked" 0-6)
                if (misc.include(this.state.savedEvents, ith_itinItem)) {
                    newSavedEvents.push(ith_itinItem - 1);
                    indexRemove = this.state.savedEvents.indexOf(ith_itinItem);
                    if (indexRemove > -1) { // remove old index that was locked (if any)
                        newSavedEvents.splice(indexRemove, 1);
                    }
                }
                if (misc.include(this.state.savedEvents, ith_itinItem - 1)) {
                    newSavedEvents.push(ith_itinItem);
                    indexRemove = this.state.savedEvents.indexOf(ith_itinItem - 1);
                    if (indexRemove > -1) { // remove old index that was locked (if any)
                        newSavedEvents.splice(indexRemove, 1);
                    }
                }

                // Correctly update the eliminatedEvents state (indices of the itinerary that are "x-ed" 0-6)
                if (misc.include(this.state.eliminatedEvents, ith_itinItem)) {
                    newEliminatedEvents.push(ith_itinItem - 1);
                    indexRemove = this.state.eliminatedEvents.indexOf(ith_itinItem);
                    if (indexRemove > -1) { // remove old index that was locked (if any)
                        newEliminatedEvents.splice(indexRemove, 1);
                    }
                }
                if (misc.include(this.state.eliminatedEvents, ith_itinItem - 1)) {
                    newEliminatedEvents.push(ith_itinItem);
                    indexRemove = this.state.eliminatedEvents.indexOf(ith_itinItem - 1);
                    if (indexRemove > -1) { // remove old index that was locked (if any)
                        newEliminatedEvents.splice(indexRemove, 1);
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
                    itinTimes: this.state.itinTimes,
                    eliminated: this.state.eliminated,
                    checked: this.state.checked,
                    savedEvents: newSavedEvents,
                    eliminatedEvents: newEliminatedEvents,
                });
            }
        }

    }

    // This function handles the state updates for when the "move down" button is pressed in an itinerary item
    handleMoveItinItemDown(e) {
        var ith_itinItem = parseInt(e.target.value, 10); // this is the index of the item being moved
        let resultsArray = this.state.resultsArray.slice();
        let newSavedEvents = this.state.savedEvents.slice();
        let newEliminatedEvents = this.state.eliminatedEvents.slice();
        var indexRemove;

        if (ith_itinItem < resultsArray.length - 1 && ith_itinItem !== null && ith_itinItem !== undefined) {

            var validMove = true;
            // check that the item can be moved down
            if (resultsArray[ith_itinItem].time.localeCompare(CONSTANTS.FOODTIME_STR) !== 0
                && resultsArray[ith_itinItem].origin.localeCompare(CONSTANTS.ORIGINS_NONE) !== 0) {
                if (resultsArray[ith_itinItem + 1].time.localeCompare(CONSTANTS.FOODTIME_STR) !== 0
                    && resultsArray[ith_itinItem + 1].origin.localeCompare(CONSTANTS.ORIGINS_NONE) !== 0) {
                    validMove = false;
                }
            }

            if (validMove) {
                // Swap itinerary item objects and times
                var tempItinItemObj_Down = resultsArray[ith_itinItem];
                tempItinItemObj_Down.other = ith_itinItem + 1;
                this.state.resultsArray[ith_itinItem + 1] = tempItinItemObj_Down;
                this.state.itinTimes[ith_itinItem + 1] = misc.convertMilTime(tempItinItemObj_Down.time);

                var tempItinItemObj_Up = resultsArray[ith_itinItem + 1];
                tempItinItemObj_Up.other = ith_itinItem;
                this.state.resultsArray[ith_itinItem] = tempItinItemObj_Up;
                this.state.itinTimes[ith_itinItem] = misc.convertMilTime(tempItinItemObj_Up.time);

                // Swap the "checked" state to show a locked or unlocked icon
                var tempNewState = this.state.checked[ith_itinItem];
                this.state.checked[ith_itinItem] = this.state.checked[ith_itinItem + 1];
                this.state.checked[ith_itinItem + 1] = tempNewState;

                // Swap the "eliminated" state to show a canceled or plus icon
                tempNewState = this.state.eliminated[ith_itinItem];
                this.state.eliminated[ith_itinItem] = this.state.eliminated[ith_itinItem + 1];
                this.state.eliminated[ith_itinItem + 1] = tempNewState;

                // Correctly update the savedEvents state (indices of the itinerary that are "locked" 0-6)
                if (misc.include(this.state.savedEvents, ith_itinItem)) {
                    newSavedEvents.push(ith_itinItem + 1);
                    indexRemove = this.state.savedEvents.indexOf(ith_itinItem);
                    if (indexRemove > -1) { // remove old index that was locked (if any)
                        newSavedEvents.splice(indexRemove, 1);
                    }
                }
                if (misc.include(this.state.savedEvents, ith_itinItem + 1)) {
                    newSavedEvents.push(ith_itinItem);
                    indexRemove = this.state.savedEvents.indexOf(ith_itinItem + 1);
                    if (indexRemove > -1) { // remove old index that was locked (if any)
                        newSavedEvents.splice(indexRemove, 1);
                    }
                }

                // Correctly update the eliminatedEvents state (indices of the itinerary that are "x-ed" 0-6)
                if (misc.include(this.state.eliminatedEvents, ith_itinItem)) {
                    newEliminatedEvents.push(ith_itinItem + 1);
                    indexRemove = this.state.eliminatedEvents.indexOf(ith_itinItem);
                    if (indexRemove > -1) { // remove old index that was locked (if any)
                        newEliminatedEvents.splice(indexRemove, 1);
                    }
                }
                if (misc.include(this.state.eliminatedEvents, ith_itinItem + 1)) {
                    newEliminatedEvents.push(ith_itinItem);
                    indexRemove = this.state.eliminatedEvents.indexOf(ith_itinItem + 1);
                    if (indexRemove > -1) { // remove old index that was locked (if any)
                        newEliminatedEvents.splice(indexRemove, 1);
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
                    itinTimes: this.state.itinTimes,
                    eliminated: this.state.eliminated,
                    checked: this.state.checked,
                    savedEvents: newSavedEvents,
                    eliminatedEvents: newEliminatedEvents,
                });
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
        let newEliminatedEvents = this.state.eliminatedEvents.slice();
        if (e.target.checked) {
            if (!misc.include(this.state.savedEvents, i_checkbox)) { // if i_checkbox is not already in the savedEvents array
                this.state.savedEvents.push(i_checkbox);
            }
            checked[i_checkbox] = 1;
        }
        // If the checkbox is NOT checked, find and remove the checkbox index from the states
        else {
            var index = this.state.savedEvents.indexOf(i_checkbox);

            if (index > -1) {
                this.state.savedEvents.splice(index, 1);
                checked[i_checkbox] = 0;
            }

            // Handle the case in which the itinerary item is "none" but it is unlocked/not saved.
            // Re-searching/pressing plan button should randoming populate in this scenario
            if (this.state.checked[i_checkbox]) {
                this.state.eliminated[i_checkbox] = 0;
                index = this.state.eliminatedEvents.indexOf(i_checkbox);
                if (index > -1) {
                    newEliminatedEvents.splice(index, 1);
                }
            }
        }

        // Update states
        this.setState({
            checked: checked,
            eliminated: this.state.eliminated,
            eliminatedEvents: newEliminatedEvents,
        })
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

            // update states
            this.handleUpdateItinerary(tempNoneObj);
            this.setState({ eliminated: eliminated });

        }
        // If the checkbox is unchecked, find and remove the checkbox index from the states
        else {
            var index = this.state.eliminatedEvents.indexOf(i_checkbox);
            var savedIndex;
            var newSavedEvents = this.state.savedEvents.slice();
            let checked = this.state.checked.slice();
            // from 0 to 6 inclusive

            // add back in a random event/restaurant
            var itemsToChooseFrom = [];
            if (i_checkbox % 2 === 0) { // event itinerary slot (i_checkbox = 0,2,4,6)
                for (var i = 0; i < CONSTANTS.APIKEYS.length; i++) {
                    if (this.state.filteredApiData[CONSTANTS.APIKEYS[i]][CONSTANTS.EVENTKEYS[i_checkbox]] &&
                        this.state.filteredApiData[CONSTANTS.APIKEYS[i]][CONSTANTS.EVENTKEYS[i_checkbox]] !== undefined &&
                        this.state.filteredApiData[CONSTANTS.APIKEYS[i]][CONSTANTS.EVENTKEYS[i_checkbox]] !== null) {
                        if (this.state.filteredApiData[CONSTANTS.APIKEYS[i]][CONSTANTS.EVENTKEYS[i_checkbox]].length > 0) {
                            itemsToChooseFrom.push(this.state.filteredApiData[CONSTANTS.APIKEYS[i]][CONSTANTS.EVENTKEYS[i_checkbox]]);
                        }
                    }
                }
            }
            else { //restaurant slot
                // this is bad practice as the values are hardcoded
                if (i_checkbox === 1) {
                    itemsToChooseFrom.push(this.state.filteredApiData[CONSTANTS.APIKEYS[4]]); // breakfast
                }
                else if (i_checkbox === 3) {
                    itemsToChooseFrom.push(this.state.filteredApiData[CONSTANTS.APIKEYS[5]]); // lunch
                }
                else if (i_checkbox === 5) {
                    itemsToChooseFrom.push(this.state.filteredApiData[CONSTANTS.APIKEYS[6]]); // dinner
                }
            }

            var len = itemsToChooseFrom.length;
            if (len > 0) {
                if (itemsToChooseFrom[0].length === 0) len = 0; // check for a populated object, but an array of zero length
            }

            var availableFunds = parseFloat(this.state.budgetmax) - parseFloat(this.state.totalCost);
            var tempEventCost = parseFloat(availableFunds + 1);
            if (len > 0) {
                var irand = 0;
                var irandInnerArray = 0;
                var newItineraryObj;
                var cnt = 0;
                var maxIter = 10;
                // finding a random new item to insert into the slot that was previously a "none" item
                while (tempEventCost > availableFunds && cnt < maxIter) {
                    irand = misc.randomIntFromInterval(0, len - 1);
                    irandInnerArray = misc.randomIntFromInterval(0, itemsToChooseFrom[irand].length - 1);
                    newItineraryObj = itemsToChooseFrom[irand][irandInnerArray];
                    tempEventCost = parseFloat(newItineraryObj.cost);
                    cnt++;
                }
                if (cnt === maxIter) {
                    if (i_checkbox % 2 === 0) {
                        newItineraryObj = CONSTANTS.NONE_ITEM_EVENT;
                    }
                    else {
                        newItineraryObj = CONSTANTS.NONE_ITEM;
                    }
                }
                newItineraryObj.other = i_checkbox;

                // Remove savedEvents and reset checked[i_checkbox] state since when adding back a
                // random item, since it clears the lock
                this.state.checked[i_checkbox] = 0;
                savedIndex = this.state.savedEvents.indexOf(i_checkbox);
                if (savedIndex > -1) {
                    newSavedEvents.splice(savedIndex, 1);
                }

                // actually update the states
                this.handleUpdateItinerary(newItineraryObj);
                this.setState({ //this overwrites some states being set in handleUpdateItinerary. Not ideal. I know
                    checked: this.state.checked,
                    savedEvents: newSavedEvents,
                })
            }

            if (index > -1) {
                this.state.eliminatedEvents.splice(index, 1);
                this.state.savedEvents.splice(index, 1);
                eliminated[i_checkbox] = 0;
                checked[i_checkbox] = 0;

                this.setState({ eliminated: eliminated, checked: checked });
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

        // only go through this logic if the itinerary is populated (ts the if statement to check)
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

    // this function is a callback from the more options component to set all food costs defined by the user
    handleUpdateUserFoodCost(e) {
        var indexDBcompat = window.indexedDB;
        var myStorage = window.localStorage;
        var userFoodCost = parseFloat(e);
        var allApiData;
        this.setState({
            userFoodCost: userFoodCost,
        })

        if (this.state.allApiData !== undefined) {
            allApiData = updateAllFoodCosts(userFoodCost, this.state.allApiData);
            this.setState({
                allApiData: allApiData,
            })

            // Update persistent api data in browser
            if (indexDBcompat && myStorage) {
                idb_keyval.set('apiData', allApiData)
                    .then(function (e) {
                    }.bind(this))
                    .catch(err => console.log('It failed in handleUpdateUserFoodCost!', err));
            }
        }
    }

    // this function is a callback from the more options component to set all event costs that were previously approximat costs
    handleUpdateUserEventCost(e) {
        var indexDBcompat = window.indexedDB;
        var myStorage = window.localStorage;
        var userEventCost = parseFloat(e);
        var allApiData;
        this.setState({
            userEventCost: userEventCost,
        });

        if (this.state.allApiData !== undefined) {
            allApiData = updateAllEventCosts(userEventCost, this.state.allApiData);
            this.setState({
                allApiData: allApiData,
            });

            // Update persistent api data in browser
            if (indexDBcompat && myStorage) {
                idb_keyval.set('apiData', allApiData)
                    .then(function (e) {
                    }.bind(this))
                    .catch(err => console.log('It failed in handleUpdateUsereventCost!', err));
            }
        }
    }


    handleUpdateEventTypeSearch(e) {
        this.setState({
            eventType: e,
            tabState: CONSTANTS.NAV_EVENT_TAB_ID,
        });
        this.handleSubmit(e);
    }

    handleMoreInfo(e) {
        var tempShowMoreInfo = (this.state.showMoreInfo).slice();
        tempShowMoreInfo[e] = !tempShowMoreInfo[e];
        this.setState({
            showMoreInfo: tempShowMoreInfo,
        })
    }

    handleEventCostChange(edittedEventCost, edittedEventName, i_resultsArray, edittedEventOrigin, i_originalItinPos) {
        var indexDBcompat = window.indexedDB;
        var myStorage = window.localStorage;
        var bestItineraryObjsParsed;

        console.clear();
        console.log("Handling event cost change")
        console.log(edittedEventCost)

        // edittedEventCost is a float
        if (edittedEventCost !== null &&
            edittedEventCost !== undefined &&
            !isNaN(edittedEventCost) &&
            indexDBcompat && myStorage) {

            i_resultsArray = parseInt(i_resultsArray, 10);
            i_originalItinPos = parseInt(i_originalItinPos, 10); // this is the itinerary slot the object originally is from
            // (i.e. for a breakfast item, i_originalItinPos will always equal 1
            // similarly, for an event 1 item, i_originalItinPos will always equal 0)
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
                    bestItineraryObjsParsed = JSON.parse(myStorage.getItem("prevBestItinerarySavedObjects")); // this object array is used to overwrite new itinerary items during GA with the saved/locked ones in the same slot from the previous itinerary
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
                bestItineraryObjsParsed = JSON.parse(myStorage.getItem("prevBestItinerarySavedObjects")); // this object array is used to overwrite new itinerary items during GA with the saved/locked ones in the same slot from the previous itinerary
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
                        if (i_originalItinPos === 1) {
                            apiKey = CONSTANTS.APIKEYS[4];
                        }
                        else if (i_originalItinPos === 3) {
                            apiKey = CONSTANTS.APIKEYS[5];
                        }
                        else if (i_originalItinPos === 5) {
                            apiKey = CONSTANTS.APIKEYS[6];
                        }
                    }

                    console.log("All api data in handleEventCostChange")
                    console.log(apiData_in)
                    console.log(apiKey)

                    if (apiKey.localeCompare('none') !== 0) {
                        if (edittedEventOrigin.localeCompare(CONSTANTS.ORIGINS_YELP) === 0) {
                            arr = apiData_in[apiKey];
                        }
                        else {
                            arr = apiData_in[apiKey][CONSTANTS.EVENTKEYS[i_originalItinPos]];
                        }

                        console.log("bestItineraryObjsParsed in handleEventCostChange")
                        console.log(bestItineraryObjsParsed)
                        console.log(arr)

                        // Find the index within the proper array of event objects that has an event name that matches with
                        // edittedEventName
                        elementPos = misc.findEventObjectByName(arr, edittedEventName);
                        // If match is found, update the cost to whatever the user set
                        if (elementPos !== -1) {
                            if (edittedEventOrigin.localeCompare(CONSTANTS.ORIGINS_YELP) === 0) {
                                apiData_in[apiKey][elementPos].cost = edittedEventCost;
                            }
                            else {
                                apiData_in[apiKey][CONSTANTS.EVENTKEYS[i_originalItinPos]][elementPos].cost = edittedEventCost;
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

    handleSubmit(e) {
        try {
            e.preventDefault();
        }
        catch (err) {
            //do nothing
        }
        //revisit
        // this.setState({ resultsArray: [] });
        console.clear();
        this.handleOutsideClick();
        // Handle empty budget inputs
        if (!this.state.budgetmax || isNaN(this.state.budgetmax) || this.state.budgetmax === undefined) {
            this.setState({
                budgetmax: CONSTANTS.MAX_BUDGET_DEFAULT,
            })
        }
        if (!this.state.budgetmin || isNaN(this.state.budgetmin) || this.state.budgetmax === undefined) {
            this.setState({
                budgetmin: CONSTANTS.MIN_BUDGET_DEFAULT,
            })
        }

        //Handle empty search radius input
        if (!this.state.searchRadius || isNaN(this.state.searchRadius) || this.state.searchRadius === undefined
            || this.state.searchRadius === "") {
            this.setState({
                searchRadius: CONSTANTS.DEFAULT_SEARCH_RADIUS_MI,
            })
        }

        this.state.searchRadiusForFilterCompare = this.state.searchRadius; //this should be only place searchRadiusForFilterCompare should be set
        if (this.state.filterRadius > this.state.searchRadiusForFilterCompare) {
            this.state.filterRadius = this.state.searchRadiusForFilterCompare;
            this.setState({
                filterRadius: this.state.searchRadiusForFilterCompare,
            });
        }

        console.log("search radius for filter: " + this.state.searchRadiusForFilterCompare);
        console.log("search radius: " + this.state.searchRadius);
        console.log("filter radius: " + this.state.filterRadius);

        var insideBudget = true;
        if (this.state.resultsArray.length > 1) {
            var arrayOfCosts = [
                this.state.resultsArray[0].cost,
                this.state.resultsArray[1].cost,
                this.state.resultsArray[2].cost,
                this.state.resultsArray[3].cost,
                this.state.resultsArray[4].cost,
                this.state.resultsArray[5].cost,
                this.state.resultsArray[6].cost,
            ];

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
        }

        var myStorage = window.localStorage;
        var indexDBcompat = window.indexedDB;
        this.locationCheckResult = -1;

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
                    var cityName = '';
                    var validLocationObj = misc.checkIfValidLocation(data_latlon);
                    this.locationCheckResult = validLocationObj.returnOption;
                    if (validLocationObj.validFlag) {
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
                                        cityName = data_city.results[5].formatted_address;
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
                                        var doAPICallsObj = determineAPICallBool(myStorage, this.state.startDate, today, locationLatLong, this.state.searchRadius, this.state.eventType);

                                        if (doAPICallsObj.doApiCallsFlag || clearApiData || !indexDBcompat) {
                                            this.setState({
                                                loading: true
                                            });
                                            // Reset filters
                                            this.state.filterRadius = this.state.searchRadiusForFilterCompare;
                                            this.setState({
                                                filterRadius: this.state.searchRadiusForFilterCompare,
                                                priceFilterRange: [CONSTANTS.DEFAULT_PRICEFILTER_MIN, CONSTANTS.DEFAULT_PRICEFILTER_MAX],
                                                timeFilterRange: [CONSTANTS.DEFAULT_TIMEFILTER_MIN, CONSTANTS.DEFAULT_TIMEFILTER_MAX],
                                                apiCalls: true,
                                            });

                                            // Reset API data cached timestamp
                                            resetAPIDataTimeStampToNow(myStorage);

                                            console.log("Do API calls!!!")
                                            // Do API requests and return a promise object to display results
                                            var promiseObj = this.apiService.getData(this.state.eventType,
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

                                                // if user saved an event previously, but the app needs to redo api calls,
                                                // keep the saved events only if the call redo is from event type or radius change
                                                if (doAPICallsObj.eventTypeSearchTermIsDifferent ||
                                                    doAPICallsObj.radiusIsDifferent) {
                                                    if (this.state.savedEvents.length > 0 && null !== myStorage.getItem('prevBestItinerarySavedObjects')) {
                                                        var bestItineraryObjsParsed = JSON.parse(myStorage.getItem("prevBestItinerarySavedObjects"));
                                                        savedEvents = this.state.savedEvents.map(Number);
                                                    }
                                                    eliminatedEvents = this.state.eliminatedEvents;
                                                }

                                                // Preprocess data for genetic algo
                                                var dataForGA = processAPIDataForGA(data.data,
                                                    this.state.eventFilterFlags,
                                                    savedEvents,
                                                    bestItineraryObjsParsed,
                                                    this.state.userAddedEvents);

                                                if (this.state.userFoodCost !== 0) {
                                                    data.data = updateAllFoodCosts(this.state.userFoodCost, data.data);
                                                }
                                                data.data = updateAllEventCosts(this.state.userEventCost, data.data);

                                                // Do optimization to find locally "best" itinerary
                                                var optimItinerary = genAlgo.doGA(dataForGA,
                                                    this.state.budgetmax,
                                                    this.state.budgetmin,
                                                    eliminatedEvents);

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
                                                    resultsArrayOutput.splice(1, 6);

                                                    var messageStrObj = {
                                                        textArray: CONSTANTS.NO_ITINERARIES_FOUND_TEXT,
                                                        boldIndex: -1
                                                    };

                                                    this.setState({
                                                        resultsArray: resultsArrayOutput,
                                                        checked: [0, 0, 0, 0, 0, 0, 0], //reset the checkboxes to being unchecked
                                                        eliminated: [0, 0, 0, 0, 0, 0, 0], //reset the checkboxes for the eliminated slots
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
                                                        cityName: cityName,
                                                    });
                                                    this.handleData([], [], mapCenter);
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
                                                        textArray: [CONSTANTS.MAX_EVENT_COST_NOTE
                                                            , "$" + optimItinerary.maxCost.toString(),
                                                        CONSTANTS.MAX_EVENT_COST_NOTE_END],
                                                        boldIndex: 1
                                                    };

                                                    // Set the state in this component and re-render
                                                    var tempCheckedState = [0, 0, 0, 0, 0, 0, 0];
                                                    var tempEliminatedState = [0, 0, 0, 0, 0, 0, 0];
                                                    // Carry over the saved/eliminated itinerary items if api calls are performed because of
                                                    // a change in search radius or a change in event type
                                                    if (doAPICallsObj.eventTypeSearchTermIsDifferent ||
                                                        doAPICallsObj.radiusIsDifferent) {
                                                        tempCheckedState = this.state.checked;
                                                        tempEliminatedState = this.state.eliminated;
                                                    }
                                                    this.setState({
                                                        resultsArray: resultsArrayOutput,
                                                        itinTimes: timesOutput,
                                                        savedEvents: savedEvents,
                                                        checked: tempCheckedState, //reset the checkboxes to being unchecked
                                                        eliminated: tempEliminatedState, //reset the checkboxes for the eliminated slots
                                                        eliminatedEvents: eliminatedEvents,
                                                        totalCost: optimItinerary.totalCost,
                                                        loading: false,
                                                        showMoreInfo: [false, false, false, false, false, false, false],
                                                        message: messageStrObj,
                                                        allApiData: data.data,
                                                        pageNumber: 1,
                                                        foodPageNumber: 1,
                                                        cityName: cityName,
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
                                            this.setState({
                                                apiCalls: false,
                                            })
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

                                                    // Used filtered data if the user has filtered the data, else use all api data
                                                    if (this.state.filteredApiData && !misc.isObjEmpty(this.state.filteredApiData)) {
                                                        console.log("Filtered API data going into GA:")
                                                        console.log(this.state.filteredApiData)
                                                        // Preprocess data for genetic algo
                                                        var dataForGA = processAPIDataForGA(this.state.filteredApiData,
                                                            this.state.eventFilterFlags,
                                                            savedEvents,
                                                            bestItineraryObjsParsed, // previously generated itinerary
                                                            this.state.userAddedEvents);

                                                    }
                                                    else {
                                                        // Preprocess data for genetic algo
                                                        var dataForGA = processAPIDataForGA(val,
                                                            this.state.eventFilterFlags,
                                                            savedEvents,
                                                            bestItineraryObjsParsed, // previously generated itinerary
                                                            this.state.userAddedEvents);
                                                    }

                                                    // Do optimization to find locally "best" itinerary
                                                    var optimItinerary = genAlgo.doGA(dataForGA,
                                                        this.state.budgetmax,
                                                        this.state.budgetmin,
                                                        eliminatedEvents);

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
                                                        resultsArrayOutput.splice(1, 6);

                                                        var messageStrObj = {
                                                            textArray: CONSTANTS.NO_ITINERARIES_FOUND_TEXT,
                                                            boldIndex: -1
                                                        };

                                                        this.setState({
                                                            resultsArray: resultsArrayOutput,
                                                            checked: [0, 0, 0, 0, 0, 0, 0], //reset the checkboxes to being unchecked
                                                            eliminated: [0, 0, 0, 0, 0, 0, 0], //reset the checkboxes for the eliminated slots
                                                            savedEvents: [],
                                                            eliminatedEvents: [],
                                                            itinTimes: [],
                                                            totalCost: 0,
                                                            loading: false,
                                                            showMoreInfo: [false, false, false, false, false, false, false],
                                                            message: messageStrObj,
                                                            allApiData: val,
                                                            cityName: cityName,
                                                        });

                                                        this.handleData([], [], mapCenter);
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
                                                            textArray: [CONSTANTS.MAX_EVENT_COST_NOTE
                                                                , "$" + optimItinerary.maxCost.toString(),
                                                            CONSTANTS.MAX_EVENT_COST_NOTE_END],
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
                                                            cityName: cityName,
                                                        });
                                                    }

                                                }
                                                );
                                            }
                                        }
                                    }
                                }
                            }.bind(this), { key: process.env.REACT_APP_GOOGLE_API_KEY })
                        }
                        else {//invalid location
                            this.setState({
                                loading: false,
                            });
                            console.log(data_latlon)
                            console.log("invalid location input!")
                        } // end if (data_latlon.results)
                    }
                    else { //invalid location
                        this.setState({
                            loading: false,
                        });
                    } //end if (data_latlon && ...)
                }.bind(this), { key: process.env.REACT_APP_GOOGLE_API_KEY })
            }
        }
    }


    handleShowItin() {
        this.setState({ mapOrResultsState: 'results' })
    }

    handleShowMap() {
        this.setState({ mapOrResultsState: 'maps' })
    }


    handleClickDescOpen(e) {
        var button_id = e.target.id;
        var eventNum = button_id.substr(button_id.length - 1);

        const dialogStates = this.state.descDialogOpen;

        dialogStates[eventNum] = true;

        this.setState({ descDialogOpen: dialogStates })
    }

    handleClickDescClose(e) {

        const dialogStates = [false, false, false, false, false, false, false];

        this.setState({ descDialogOpen: dialogStates })
    }

    //clicking into fixed nav search input
    handleFocusSearchInput() {
        var width = this.searchIconNode.clientWidth + this.searchInputNode.clientWidth;
        this.setState({searchInputWidth: width});

        window.addEventListener("resize", this.updateDimensions);

        var homepageClasses = this.state.homepageFormClasses;
        if(homepageClasses.indexOf('show') === -1) {
            homepageClasses.push('show');
        }

        this.setState({
            homepageFormClasses: homepageClasses,
        });
    }

    //clicking out of fixed nav search input
    handleBlurSearchInput() {
        if(this.state.homepageFormClasses.indexOf('show') !== -1) {
            document.addEventListener('mousedown', this.handleMouseClick);
        }
    }

    render() {
        // console.log("userinput render function!")
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
        };

        var ITINERARY_LENGTH = this.state.resultsArray.length;
        const { term, budgetmax, budgetmin, location } = this.state;
        var indents = [];

        // valid/invalid location input error message
        var locationErrorMessage = null;
        if (this.locationCheckResult === 1) {
            locationErrorMessage = <LocationErrorDialog title={CONSTANTS.LOCATION_INPUT_ERROR_OUTSIDE_TITLE}
            desc={CONSTANTS.LOCATION_INPUT_ERROR_OUTSIDE_DESC}
            open={true}/>;
        }
        else if (this.locationCheckResult === 2) {
            locationErrorMessage = <LocationErrorDialog title={CONSTANTS.LOCATION_INPUT_ERROR_INVALID_TITLE}
            desc={CONSTANTS.LOCATION_INPUT_ERROR_INVALID_DESC}
            open={true}/>;
        }

        // Itinerary info logic
        if (this.state.resultsArray.length > 1) {
            // Calculate distances between locations in itinerary
            var distances = calcItineraryDistancesFromLocation2Location(this.state.resultsArray);
            var iFirstValidLocation = 0; // index of first itinerary item that has a valid lat long location
            for (var i = 0; i < distances.length; i++) {
                if (distances[i] !== -1.0) {
                    iFirstValidLocation = i;
                    break;
                }
            }

            // Form the itinerary results display
            for (var i = 0; i < ITINERARY_LENGTH; i++) {
                var origin = this.state.resultsArray[i].origin;
                var moreInfoStyles = [];
                moreInfoStyles.push(ITINCONTAINER_STYLE);

                if (!this.state.showMoreInfo[i]) {
                    moreInfoStyles.push(HIDDEN);
                }
                var lock_icon = <Icon>lock</Icon>;
                if (!this.state.checked[i]) {
                    lock_icon = <Icon>lock_open</Icon>;
                }

                var elim_icon = <Icon>add</Icon>;
                var elimToolTipStr = CONSTANTS.ADD_TOOLTIP_STR;
                if (!this.state.eliminated[i]) {
                    elim_icon = <Icon>block</Icon>;
                    elimToolTipStr = CONSTANTS.X_TOOLTIP_STR;
                }


                // Itinerary header
                var itinHeadStr = CONSTANTS.ITIN_TITLE_TEXT +
                    misc.capFirstLetter(this.state.location);
                var dateStrArrayTemp = this.state.startDate.toDate().toDateString().split(" ");
                if (dateStrArrayTemp.length === 4) {
                    itinHeadStr = itinHeadStr + ", " + dateStrArrayTemp[0] + ". " + dateStrArrayTemp[1] + ". " +
                        dateStrArrayTemp[2] + ", " + dateStrArrayTemp[3];
                }

                // Itinerary
                var key = 'tbody-' + i;
                let id = 'checkbox-' + i;
                let elim_id = 'elim-' + i;
                let description = this.state.resultsArray[i].description;
                let num_words_desc = 0;
                let num_words_name = 0;
                let descDialog = null;
                var shortenedDesc = description;
                var isShortDescHTML = false;

                if (description) {
                    shortenedDesc = shortenedDesc.substring(0, CONSTANTS.ITIN_CARD_DESC_STR_LENGTH) + '...';
                    if (shortenedDesc.substring(0, 1).localeCompare('<') === 0) {
                        isShortDescHTML = true;
                    }
                    num_words_desc = description.split(/\W+/).length;
                    if (num_words_desc > 10) {
                        descDialog = <DescDialog eventname={this.state.resultsArray[i].name} open={this.state.descDialogOpen[i]} eventDesc={description} handleClose={this.handleClickDescClose}></DescDialog>;
                    }
                }
                let name = this.state.resultsArray[i].name;
                let truncate_name = 0;
                if (name) {
                    num_words_name = name.split(/\W+/).length;
                    if (num_words_name > 9) {
                        let result = this.state.resultsArray[i].name.split(/\W+/).slice(0, 10).join(" ");
                        truncate_name = result + '...';
                        truncate_name = <TooltipMat placement="top" title={name}><span>{truncate_name}</span></TooltipMat>
                    }
                }

                var dataNumAttribute = i + 1;
                if (!this.state.showDetailedItinerary) {
                indents.push(
                    <MiniItineraryCard
                        key={key}
                        cardIndex={i}
                        itineraryCardId={id}
                        dataNumAttribute={dataNumAttribute}
                        truncate_name={truncate_name}
                        itinTime={this.state.itinTimes[i]}
                        resultsArray={this.state.resultsArray}
                        origins={origins}
                        handleItinCardMouseEnter={this.handleItinCardMouseEnter}
                        handleItinCardMouseLeave={this.handleItinCardMouseLeave}
                    />
                );
                }
                else {
                indents.push(
                    <ItineraryCard
                        key={key}
                        cardIndex={i}
                        itineraryCardId={id}
                        lockIcon={lock_icon}
                        elimIcon={elim_icon}
                        itinCardCheckedState={this.state.checked[i]}
                        itinCardElimState={this.state.eliminated[i]}
                        elimId={elim_id}
                        elimToolTipStr={elimToolTipStr}
                        dataNumAttribute={dataNumAttribute}
                        truncate_name={truncate_name}
                        url={this.state.resultsArray[i].url}
                        name={this.state.resultsArray[i].name}
                        itinTime={this.state.itinTimes[i]}
                        num_words_desc={num_words_desc}
                        description={description}
                        origin={this.state.resultsArray[i].origin}
                        distance_from_input_location={this.state.resultsArray[i].distance_from_input_location}
                        isShortDescHTML={isShortDescHTML}
                        shortenedDesc={shortenedDesc}
                        descDialog={descDialog}
                        cost={this.state.resultsArray[i].cost}
                        origins={origins}
                        handleCheckbox={this.handleCheckbox}
                        handleEliminate={this.handleEliminate}
                        handleClickDescOpen={this.handleClickDescOpen}
                        handleEventCostChange={this.handleEventCostChange}
                        handleMoveItemUp={this.handleMoveItinItemUp}
                        handleMoveItemDown={this.handleMoveItinItemDown}
                        handleItinCardMouseEnter={this.handleItinCardMouseEnter}
                        handleItinCardMouseLeave={this.handleItinCardMouseLeave}
                        distances={distances}
                        resultsArray={this.state.resultsArray}
                        iFirstValidLocation={iFirstValidLocation}
                    />
                );
                }
            }

            // The Total cost display
            var messageObject;
            var totalCostDisplayed;
            if (this.state.totalCost > this.state.budgetmax) {
                messageObject = {
                    textArray: [CONSTANTS.EXCEEDED_BUDGET_TEXT + " of $" + this.state.budgetmax
                    + " by $" + misc.round2NearestHundredth(this.state.totalCost - this.state.budgetmax) + "!"],
                    boldIndex: 0,
                };
                totalCostDisplayed = <font color="red"><b>${this.state.totalCost}</b></font>;
            }
            else if (this.state.totalCost < this.state.budgetmin) {
                messageObject = {
                    textArray: [CONSTANTS.LESS_THAN_MINBUDGET_TEXT + " of $" + this.state.budgetmax
                    + " by $" + misc.round2NearestHundredth(this.state.budgetmin - this.state.totalCost) + "!"],
                    boldIndex: 0,
                };
                totalCostDisplayed = <font color="red"><b>${this.state.totalCost}</b></font>;
            }
            else {
                messageObject = this.state.message;
                totalCostDisplayed = <b>${this.state.totalCost}</b>;
            }

            // Itinerary summary info like total cost and buttons
            var itinerarySummaryComponent = [];
            itinerarySummaryComponent.push(
                <ItinerarySummary
                    totalCostDisplayed={totalCostDisplayed}
                    message={this.state.message}
                    messageObject={messageObject}
                    location={this.state.location}
                    totalCost={this.state.totalCost}
                    resultsArray={this.state.resultsArray}
                    handleSubmit={this.handleSubmit}
                    handleToggleItinerary={this.handleToggleItinerary}
                    showDetailedItinerary={this.state.showDetailedItinerary}
                    itinHeadStr={itinHeadStr}
                />);
        }
        else if (this.state.resultsArray.length === 1) { // no itinerary was found
            // The Total cost display
            var messageObject;
            var totalCostDisplayed;
            messageObject = this.state.message;
            totalCostDisplayed = "";
            // Itinerary summary info like total cost and buttons
            var itinerarySummaryComponent = [];
            itinerarySummaryComponent.push(
                <ItinerarySummary
                    totalCostDisplayed={totalCostDisplayed}
                    message={this.state.message}
                    messageObject={messageObject}
                    location={this.state.location}
                    totalCost={this.state.totalCost}
                    resultsArray={this.state.resultsArray}
                    handleSubmit={this.handleSubmit}
                    itinHeadStr={itinHeadStr}
                />);
        }

        var userevents = [];
        for (i = 0; i < this.state.userAddedEvents.length; i++) {
            userevents.unshift(<DeleteUserEvent key={key} userevent={this.state.userAddedEvents[i]} handleDelete={this.handleDeleteUserEvent} />);
        }


        // Event Pagination
        var pages = [];
        var pageNumber;
        if (!misc.isObjEmpty(this.state.allApiData)) {
            var filteredEventObj = countAndFilterEventApiData(this.state.allApiData,
                this.state.eventFilterFlags,
                this.state.timeFilterRange,
                this.state.priceFilterRange, //[minPrice maxPrice]
                this.state.filterRadius, this.state.searchRadiusForFilterCompare);


            var numPages = Math.floor(filteredEventObj.numFilteredEvents / CONSTANTS.NUM_RESULTS_PER_PAGE) + 1;
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
            eventsMultiResults = filteredEventObj.filteredEvents;
        }

        // Food Pagination
        var foodPages = [];
        var foodPageNumber;
        if (!misc.isObjEmpty(this.state.allApiData)) {
            var filteredFoodObj = countAndFilterFoodApiData(this.state.allApiData,
                this.state.mealFilterFlags,
                this.state.priceFilterRange, //[minPrice maxPrice],
                this.state.filterRadius);

            var numPages = Math.floor(filteredFoodObj.numFilteredFoodPlaces / CONSTANTS.NUM_RESULTS_PER_PAGE) + 1;
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
            foodMultiResults = filteredFoodObj.filteredFoodPlaces;
        }

        //Construct all filtered data into an object for the GA
        if (!misc.isObjEmpty(this.state.allApiData)) {
            var numMeetupEvents = eventsMultiResults[2].Event1.length + eventsMultiResults[2].Event2.length + eventsMultiResults[2].Event3.length + eventsMultiResults[2].Event4.length;
            var numEventbriteEvents = eventsMultiResults[0].Event1.length + eventsMultiResults[0].Event2.length + eventsMultiResults[0].Event3.length + eventsMultiResults[0].Event4.length;
            var numSeatgeekEvents = eventsMultiResults[3].Event1.length + eventsMultiResults[3].Event2.length + eventsMultiResults[3].Event3.length + eventsMultiResults[3].Event4.length;
            var numGooglePlaces = eventsMultiResults[1].Event1.length + eventsMultiResults[1].Event2.length + eventsMultiResults[1].Event3.length + eventsMultiResults[1].Event4.length;
            this.state.filteredApiData = {
                meetupItemsGlobal: eventsMultiResults[2],
                eventbriteGlobal: eventsMultiResults[0],
                seatgeekItemsGlobal: eventsMultiResults[3],
                googlePlacesGlobal: eventsMultiResults[1],
                yelpBreakfastItemsGlobal: foodMultiResults[0],
                yelpLunchItemsGlobal: foodMultiResults[1],
                yelpDinnerItemsGlobal: foodMultiResults[2],
                numDataPoints: {
                    numMeetupEvents: numMeetupEvents,
                    numYelpEvents: 0,
                    numEventbriteEvents: numEventbriteEvents,
                    numSeatgeekEvents: numSeatgeekEvents,
                    numGooglePlaces: numGooglePlaces,
                    numYelpBreakfastPlaces: foodMultiResults[0].length,
                    numYelpLunchPlaces: foodMultiResults[1].length,
                    numYelpDinnerPlaces: foodMultiResults[2].length,
                    numOfEvents: numMeetupEvents + numEventbriteEvents + numSeatgeekEvents + numGooglePlaces,
                    numOfFoodPlaces: foodMultiResults[0].length + foodMultiResults[1].length + foodMultiResults[2].length,
                }
            }
        }

        const { classes, theme } = this.props;

        // Handling itinerary div width when results presented
        var itinContent = ['main', 'mapsfix', 'itinerary','col-md-4'];
        // if (this.state.resultsArray.length > 0) { //if there are itinerary results set the div width to 8 columns
        //     itinContent.push('col-md-7');
        // }
        // else {
        //     itinContent.push('col-md-12'); // else set the div width to 12 columns (100% of the element by definition)
        // }

        //Banner versus fixed banner
        var banner = ['banner'];
        if (this.state.resultsArray.length > 0) {
            banner.push('fixedBanner');
        }

        var mapAndResultsContent = ['mapAndResults', 'clearfix'];

        // Itinerary div css classes
        var onlyItin = ['itinDiv', 'clearfix'];
        var mapAndResultsDiv = ['clearfix', 'mapAndResultsDiv', 'sidebar','col-md-4', 'hidden'];
        if (this.state.resultsArray.length > 0) {
            mapAndResultsDiv.pop();
        } else {

        }

        // Handle tab classes dynamically. Also, whenever handleUpdateEventTypeSearch is called, reset the tab to the event tab
        var genericTabsClass = ['itinerary', 'tab-pane', 'fade'];
        var eventsTabsClass = genericTabsClass.slice();
        var restaurantsTabsClass = genericTabsClass.slice();
        var moreOptionsTabsClass = genericTabsClass.slice();

        var genericLinkClass = ['nav-item', 'nav-link'];
        var eventsLinkClass = genericLinkClass.slice();
        var restaurantsLinkClass = genericLinkClass.slice();
        var moreOptionsLinkClass = genericLinkClass.slice();

        if (this.state.tabState.localeCompare(CONSTANTS.NAV_EVENT_TAB_ID) === 0) {
            eventsTabsClass.push('show');
            eventsTabsClass.push('active');
            eventsLinkClass.push('active');
        }
        else if (this.state.tabState.localeCompare(CONSTANTS.NAV_FOOD_TAB_ID) === 0) {
            restaurantsTabsClass.push('show');
            restaurantsTabsClass.push('active');
            restaurantsLinkClass.push('active');
        }
        else {
            moreOptionsTabsClass.push('show');
            moreOptionsTabsClass.push('active');
            moreOptionsLinkClass.push('active');
        }

        //Home Page Form -- revisit
        var homepageFormClasses = this.state.homepageFormClasses;
    return (
      <div className="Userinput">
          {this.state.loading === true && this.state.resultsArray.length == 0 ?
              <div className="loader">
                  <Loader type="spinningBubbles" color="#fff" height="150px" width="150px"></Loader>
                  <h5>Planning your trip...</h5>
              </div> : false
          }
          <div className={banner.join(' ')}>
              {
                  this.state.resultsArray.length === 0 ?
                  <AppBar position="static">
                        <div className="topNavBar">
                            <span className="nav-bar-logo">Blue</span>
                            <span className="nav-bar-logo2">Planit</span>
                        </div>
                        {locationErrorMessage}
                        <Toolbar className="toolbar">
                              <form className="homepageForm" autoComplete="off" onSubmit={this.handleSubmit}>
                                  <div className="formCopy">
                                      <h3>Let us plan<br/> so you don't have to.</h3>
                                  </div>
                                  <div className="inputsRow">
                                      <div className="inputContainers">
                                          <div>
                                              <label className="inputLabel" for="location">WHERE</label>
                                              <div className="homepageIcon">
                                                  <Icon>search</Icon>
                                              </div>
                                              <TooltipMat placement="bottom" title={CONSTANTS.LOCATION_TOOLTIP_STR}>
                                                  <input required id="location" className="fixedTextInput homepageInputs" type="text" name="location" onChange={this.handleChange} autoComplete="address-level2" />
                                              </TooltipMat>
                                          </div>
                                      </div>
                                      <div className="inputContainers">
                                          <label className="inputLabel" htmlFor="datePicker">WHEN</label>
                                          <div className="form-group mb-2 datePickerWrapper">
                                              {/*<div className={searchIconClasses.join(' ')}>*/}
                                                  {/*<Icon>date_range</Icon>*/}
                                              {/*</div>*/}
                                              <DatePicker required id="datePicker"   placeholderText="mm/dd/yyyy" className="textInput fixedTextInput homepageInputs textInputLeft" selected={this.state.startDate} onChange={this.handleDateChange} minDate={CONSTANTS.TODAYDATE}  />
                                          </div>
                                      </div>
                                      <div className="inputContainers misc-params">
                                          {
                                              // <div className="form-group mb-2">
                                              // <TooltipMat placement="bottom" title={CONSTANTS.MIN_TOOLTIP_STR}>
                                              // <input /*required*/ className="textInput" type="number" min="0" name="budgetmin" /*value={budgetmin}*/ onChange={this.handleChange} placeholder="$ Min" />
                                              // </TooltipMat>
                                              // </div>
                                          }


                                          <div className="form-group mb-2">
                                              <label className="inputLabel" htmlFor="budgetmax">TRIP BUDGET</label>
                                              <div className="homepageIcon">
                                                  <Icon>credit_card</Icon>
                                              </div>
                                              <TooltipMat placement="bottom" title={CONSTANTS.MAX_TOOLTIP_STR}>
                                                  <input /*required*/ className="fixedTextInput homepageInputs" min="0" type="number" name="budgetmax" placeholder="$1000" /*value={budgetmax}*/ onChange={this.handleChange} />
                                              </TooltipMat>
                                          </div>
                                      </div>
                                      <div className="search-btn">
                                          <TooltipMat placement="bottom" title={CONSTANTS.GO_TOOLTIP_STR}>
                                              <Button variant="contained" color="secondary" type="submit">
                                              {CONSTANTS.SEARCH_BUTTON_STR}
                                              </Button>
                                          </TooltipMat>
                                      </div>
                                  </div>
                              </form>
                        </Toolbar>
                  </AppBar>
                      :
                  <div className="row topNavBar fixedNav">
                      <div ref={node => this.logoNode = node} id="logo" className="col-md-2">
                          <span className="nav-bar-logo">Blue </span>
                          <span className="nav-bar-logo2">Planit</span>
                          {locationErrorMessage}
                      </div>
                      <div ref={node => this.node = node} className="col-md-5">
                          <div>
                              <div ref={node => this.searchIconNode = node} className="searchIcon">
                                  <Icon>search</Icon>
                              </div>
                              <TooltipMat placement="bottom" title={CONSTANTS.LOCATION_TOOLTIP_STR}>
                                  <input ref={node => this.searchInputNode = node} required id="location"
                                         className="fixedTextInput search-input"
                                         type="text"
                                         name="location"
                                         onFocus={() => this.handleFocusSearchInput()}
                                         onBlur={(e) => this.handleBlurSearchInput(e)}
                                         //value={this.state.cityName}
                                         placeholder={this.state.cityName}
                                         onChange={this.handleChange}
                                         autoComplete="off"
                                  />
                              </TooltipMat>
                          </div>
                          <form style={{width: this.state.searchInputWidth}}
                                className={homepageFormClasses.join(' ')}
                                autoComplete="off"
                                onSubmit={this.handleSubmit}
                          >
                              <div className="inputs-cont">
                                  <div className="inputContainers">
                                      <label className="inputLabel" htmlFor="datePicker">WHEN</label>
                                      <div className="form-group mb-2 datePickerWrapper">
                                          {/*<div className={searchIconClasses.join(' ')}>*/}
                                          {/*<Icon>date_range</Icon>*/}
                                          {/*</div>*/}
                                          <DatePicker required id="datePicker"
                                                      placeholderText="mm/dd/yyyy"
                                                      className="textInput fixedTextInput homepageInputs textInputLeft date-input"
                                                      selected={this.state.startDate}
                                                      onChange={this.handleDateChange}
                                                      minDate={CONSTANTS.TODAYDATE}
                                          />
                                      </div>
                                  </div>
                                  <div className="inputContainers misc-params">
                                      {
                                          // <div className="form-group mb-2">
                                          // <TooltipMat placement="bottom" title={CONSTANTS.MIN_TOOLTIP_STR}>
                                          // <input /*required*/ className="textInput" type="number" min="0" name="budgetmin" /*value={budgetmin}*/ onChange={this.handleChange} placeholder="$ Min" />
                                          // </TooltipMat>
                                          // </div>
                                      }


                                      <div className="form-group mb-2">
                                          <label className="inputLabel" htmlFor="budgetmax">TRIP BUDGET</label>
                                          <div className="homepageIcon">
                                              <Icon>credit_card</Icon>
                                          </div>
                                          <TooltipMat placement="bottom" title={CONSTANTS.MAX_TOOLTIP_STR}>
                                              <input /*required*/ className="fixedTextInput homepageInputs" min="0"
                                                                  type="number" name="budgetmax"
                                                                  placeholder="$1000" /*value={budgetmax}*/
                                                                  onChange={this.handleChange}/>
                                          </TooltipMat>
                                      </div>
                                  </div>
                                  <div className="search-btn">
                                      <TooltipMat placement="bottom" title={CONSTANTS.GO_TOOLTIP_STR}>
                                          <Button variant="contained" color="secondary" type="submit">
                                              {CONSTANTS.SEARCH_BUTTON_STR}
                                          </Button>
                                      </TooltipMat>
                                  </div>
                              </div>
                          </form>

                      </div>
                  </div>
              }
          </div>
          {this.state.resultsArray.length > 0 ?
              <div className="content-parent-div clearfix">
                  <div className="row">
                      <div className="col-md-12">
                          <AllFilters
                              handlePriceFilter={this.handlePriceFilter}
                              searchRadiusForFilterCompare={this.state.searchRadiusForFilterCompare}
                              setDistance={this.handleFilterRadius}
                              handleApiFilter={this.handleApiFilter}
                              tabState={this.state.tabState}
                              handleTimeFilter={this.handleTimeFilter}
                              handleMealFilter={this.handleMealFilter}
                          />
                      </div>
                  </div>
                  <div className="row row-height wrapper eventsCont apidata">
                      <main className="col-md-4 scroll-column">
                          <div>
                              {this.state.loading === true ?
                                  ' ' :
                                  <div>
                                      <div className={onlyItin.join(' ')}>
                                          <div className="itinEvents clearfix">
                                              <div className="itinSummary">
                                                  {this.state.loading === false ?
                                                      itinerarySummaryComponent : ''}
                                              </div>
                                              {indents}
                                          </div>

                                      </div>

                                  </div>}
                          </div>
                      </main>
                      {
                          this.state.loading === true ?
                          <div className="loader results-loader">
                              <Loader type="spinningBubbles" color="#000" height="75px" width="75px"></Loader>
                              <h5>Planning your trip...</h5>
                          </div> : false
                      }
                      <div className="col-md-4 scroll-column">
                          <div className="results-column">
                                    {/* All data gets shown here (api data, a nd user added data) */}
                                    <div className="tabs tabs-style-tzoid">
                                        <nav id="nav-tab" role="tablist">
                                            <ul>
                                                <li>
                                                    <a onClick={this.handleTabState} className={eventsLinkClass.join(' ')}
                                                        id={CONSTANTS.NAV_EVENT_TAB_ID} data-toggle="tab" href="#nav-events" role="tab"
                                                        aria-controls="nav-events" aria-selected="true">Events and Places
                                                    </a>
                                                </li>
                                                <li> <a onClick={this.handleTabState} className={restaurantsLinkClass.join(' ')}
                                                        id={CONSTANTS.NAV_FOOD_TAB_ID} data-toggle="tab" href="#nav-food" role="tab"
                                                        aria-controls="nav-food" aria-selected="false"> Restaurants
                                                </a>
                                                </li>
                                                {/*<li>*/}
                                                    {/*<a onClick={this.handleTabState} className={moreOptionsLinkClass.join(' ')}*/}
                                                       {/*id={CONSTANTS.NAV_MOREOPTIONS_TAB_ID} data-toggle="tab" href="#nav-moreoptions"*/}
                                                       {/*role="tab" aria-controls="nav-moreoptions" aria-selected="false"> More Options*/}
                                                    {/*</a>*/}
                                                {/*</li>*/}
                                            </ul>
                                        </nav>
                                    </div>
                                    <div className={eventsTabsClass.join(' ')} id="nav-events" role="tabpanel"
                                        aria-labelledby="nav-options-tab">

                                        {<MultiResultDisplay apiData={eventsMultiResults}
                                            displayCategory={1} //events
                                            pageNumber={this.state.pageNumber}
                                            AddUserSelectedEventFromDisplayedResults={this.handleUpdateItinerary}
                                            priceFilterRange={this.state.priceFilterRange}
                                            maxTime={CONSTANTS.DEFAULT_MAX_TIME_4_DISPLAY}
                                            minTime={CONSTANTS.DEFAULT_MIN_TIME_4_DISPLAY}
                                            eventFilterFlags={this.state.eventFilterFlags}
                                            filterRadius={this.state.filterRadius}
                                            maxRadius={this.state.searchRadiusForFilterCompare}
                                            tabState={this.state.tabState}
                                            userEventCost={this.state.userEventCost} />}
                                        {pages}

                                    </div>

                                    <div className={restaurantsTabsClass.join(' ')} id="nav-food" role="tabpanel"
                                        aria-labelledby="nav-options-tab">
                                        {<MultiResultDisplay apiData={foodMultiResults}
                                            displayCategory={0} //restaurants
                                            pageNumber={this.state.foodPageNumber}
                                            AddUserSelectedEventFromDisplayedResults={this.handleUpdateItinerary}
                                            priceFilterRange={this.state.priceFilterRange}
                                            maxTime={CONSTANTS.DEFAULT_MAX_TIME_4_DISPLAY}
                                            minTime={CONSTANTS.DEFAULT_MIN_TIME_4_DISPLAY}
                                            eventFilterFlags={this.state.eventFilterFlags}
                                            filterRadius={this.state.filterRadius}
                                            maxRadius={this.state.searchRadiusForFilterCompare}
                                            tabState={this.state.tabState}
                                            userEventCost={this.state.userEventCost} />}
                                        {foodPages}
                                    </div>


                                    <div className={moreOptionsTabsClass.join(' ')} id="nav-moreoptions" role="tabpanel"
                                        aria-labelledby="nav-moreoptions-tab">
                                        {<MoreOptions updateUserFoodCost={this.handleUpdateUserFoodCost}
                                            updateUserEventCost={this.handleUpdateUserEventCost}
                                            updateEventTypeSearch={this.handleUpdateEventTypeSearch}
                                            currentFoodCost={this.state.userFoodCost}
                                            currentEventCost={this.state.userEventCost} />}
                                    </div>
                                </div>
                                {/* { <GoogleApiWrapper show={this.state.mapOrResultsState} results={this.state.resultsArray}
                                            center={this.state.center} showMarkerOnHoverObj={this.state.mapItinCardHoverStates}/> } */}
                            </div>
                            <div id="mapBoxID" className="col-md-4 scroll-column">
                                  <MapBoxComponent show={this.state.mapOrResultsState}
                                                   results={this.state.resultsArray}
                                                   center={this.state.center}
                                                   markerHoverStates={this.state.mapItinCardHoverStates}>
                                  </MapBoxComponent>
                            </div>
                        </div>

                    <Footer/>
              </div>
                : false }
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
function determineAPICallBool(myStorage_in, date_in, today_in, latLon_in, radius_in, eventType_in) {
    var doApiCalls = false;
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

        // Check for different event type search terms (user selects specific stuff to search for in the events)
        var eventTypeSearchTermIsDifferent = false;
        // If the field localStoredEventType is NOT null, check if it's different from the current localStoredEventType input from user
        if (null !== myStorage_in.getItem('localStoredEventType')) {
            if ((myStorage_in.getItem('localStoredEventType')).localeCompare(eventType_in) !== 0) { // 0 indicates the strings are exact matches
                myStorage_in.setItem('localStoredEventType', eventType_in);
                eventTypeSearchTermIsDifferent = true;
            }
        }
        // If the field localStoredRadius is null, set it equal to current lat lon location
        else {
            myStorage_in.setItem('localStoredEventType', eventType_in);
            eventTypeSearchTermIsDifferent = true;
        }


        // Return the proper flag
        if (dateTimeIsStale || latLonIsDifferent || radiusIsDifferent || eventTypeSearchTermIsDifferent) {
            doApiCalls = true;
            //return true; // do the API calls!
        }
        else {
            doApiCalls = false;
            //return false; // don't the API calls because data is already stored locally and a previous
            // API call was made
        }
    }
    else {
        doApiCalls = true;
        // do the API calls!
    }
    var determineAPICallObj = {
        doApiCallsFlag: doApiCalls,
        eventTypeSearchTermIsDifferent: eventTypeSearchTermIsDifferent,
        radiusIsDifferent: radiusIsDifferent,
    }
    return determineAPICallObj;
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


function countAndFilterEventApiData(allApiData, apiSource, timeFilterRange, priceFilterRange, filterRadius, maxRadius) {

    var filteredEvents = [
        { Event1: [], Event2: [], Event3: [], Event4: [] },
        { Event1: [], Event2: [], Event3: [], Event4: [] },
        { Event1: [], Event2: [], Event3: [], Event4: [] },
        { Event1: [], Event2: [], Event3: [], Event4: [] },
    ];

    var maxPrice = parseFloat(priceFilterRange[1]);
    var minPrice = parseFloat(priceFilterRange[0]);

    var maxTime = parseFloat(timeFilterRange[1]);
    var minTime = parseFloat(timeFilterRange[0]);

    filterRadius = parseFloat(filterRadius);
    maxRadius = parseFloat(maxRadius);

    var filteredEventCount = 0;
    for (var i = 0; i < CONSTANTS.NUM_OF_EVENT_APIS; i++) { // cycle through meetup -> google places
        for (var j = 0; j < CONSTANTS.NUM_OF_EVENT_SLOTS; j++) { // cycle through event1 -> event4 itinerary slots
            var eventObj = allApiData[CONSTANTS.APIKEYS[i]][CONSTANTS.EVENTKEYS[j * 2]];
            if (eventObj) {
                var lenEvents = eventObj.length;
                for (var iEvent = 0; iEvent < lenEvents; iEvent++) {
                    // apiSource is an array of 1s or 0s and is from userinput state eventFilterFlags
                    // ordered left to right: meetup, eventbrite, seatgeek, google places, select/unselect all options
                    var apiSourceLength = apiSource.length;
                    var EVENTS_ORIGINS_ARRAY = [
                        CONSTANTS.ORIGINS_MU,
                        CONSTANTS.ORIGINS_EB,
                        CONSTANTS.ORIGINS_SG,
                        CONSTANTS.ORIGINS_GP
                    ]; // same order as apiSource (order matters)

                    // Check if in price range
                    if (parseFloat(eventObj[iEvent].cost) >= minPrice && parseFloat(eventObj[iEvent].cost) <= maxPrice && parseFloat(eventObj[iEvent].distance_from_input_location) <= filterRadius) {
                        // Check if in time range
                        if (parseFloat(eventObj[iEvent].time) >= minTime && parseFloat(eventObj[iEvent].time) <= maxTime) {
                            // Check if itinerary obj is from a selected api source (ie if meetup is checked, check that this itinerary object is a meetup obj)
                            for (var k = 0; k < apiSourceLength - 1; k++) {
                                if (apiSource[k] === 1) { // api source is selected
                                    // eventbrite check (check to see that origin is NOT eventbrite)
                                    if ((filterRadius < maxRadius && eventObj[iEvent].origin.localeCompare(CONSTANTS.ORIGINS_EB) !== 0) ||
                                        filterRadius === maxRadius) {

                                        // api source matches the filter
                                        if (EVENTS_ORIGINS_ARRAY[k].localeCompare(eventObj[iEvent].origin) === 0) {
                                            filteredEventCount++;

                                            // populating the filtered events object to return
                                            if (eventObj[iEvent].origin.localeCompare(CONSTANTS.ORIGINS_EB) === 0) { // eventbrite
                                                filteredEvents[0][CONSTANTS.EVENTKEYS[j * 2]].push(eventObj[iEvent]);
                                            }
                                            else if (eventObj[iEvent].origin.localeCompare(CONSTANTS.ORIGINS_GP) === 0) {//google places
                                                filteredEvents[1][CONSTANTS.EVENTKEYS[j * 2]].push(eventObj[iEvent]);
                                            }
                                            else if (eventObj[iEvent].origin.localeCompare(CONSTANTS.ORIGINS_MU) === 0) {//meetup
                                                filteredEvents[2][CONSTANTS.EVENTKEYS[j * 2]].push(eventObj[iEvent]);
                                            }
                                            else { //seatgeek
                                                filteredEvents[3][CONSTANTS.EVENTKEYS[j * 2]].push(eventObj[iEvent]);
                                            }
                                            break;

                                        }
                                    } // eventbrite check
                                }
                            }
                        } // end if statement for time check
                    } // end if statement for price and radius check
                } // end for loop cycling through events in a field (field is like event1 -> event4 in apiData)
            } // if statement to check valide eventObj
        }
    }

    var filteredEventsObj = {
        numFilteredEvents: filteredEventCount,
        filteredEvents: filteredEvents,
    }
    return filteredEventsObj;
}


function countAndFilterFoodApiData(allApiData, mealFilterFlags, priceFilterRange, filterRadius) {

    var filteredFoodPlaces = [
        [],
        [],
        [],
    ];

    var showBreakfast = mealFilterFlags[0]; //true or false
    var showLunch = mealFilterFlags[1];
    var showDinner = mealFilterFlags[2];
    var maxPrice = parseFloat(priceFilterRange[1]);
    var minPrice = parseFloat(priceFilterRange[0]);
    filterRadius = parseFloat(filterRadius);

    var filteredFoodPlacesCount = 0;
    for (var i = 4; i < 7; i++) { // cycle through yelp breakfast to dinner (see constants file for APIKEYS)
        var foodPlaceObj = allApiData[CONSTANTS.APIKEYS[i]];

        if (foodPlaceObj) {
            var lenFoodPLaces = foodPlaceObj.length;
            for (var iFood = 0; iFood < lenFoodPLaces; iFood++) {

                // Check if in price range
                if (parseFloat(foodPlaceObj[iFood].cost) >= minPrice && parseFloat(foodPlaceObj[iFood].cost) <= maxPrice && parseFloat(foodPlaceObj[iFood].distance_from_input_location) <= filterRadius) {
                    if (i === 4 && showBreakfast) {
                        filteredFoodPlaces[0].push(foodPlaceObj[iFood]);
                        filteredFoodPlacesCount++;
                    }
                    else if (i === 5 && showLunch) {
                        filteredFoodPlaces[1].push(foodPlaceObj[iFood]);
                        filteredFoodPlacesCount++;
                    }
                    else if (i === 6 && showDinner) {
                        filteredFoodPlaces[2].push(foodPlaceObj[iFood]);
                        filteredFoodPlacesCount++;
                    }
                } // end if statement for price and radius check
            } // if statement to check valide foodPlaceObj
        }
    }

    var filteredFoodPlaceObj = {
        numFilteredFoodPlaces: filteredFoodPlacesCount,
        filteredFoodPlaces: filteredFoodPlaces,
    }
    return filteredFoodPlaceObj;
}

function updateAllFoodCosts(userFoodCost, allApiData) {
    // This function sets all food costs to userFoodCost unless it is 0. If it is zero, the food costs
    // will be the default yelp costs found in the constants file
    if (allApiData !== null && allApiData !== undefined && !misc.isObjEmpty(allApiData)) {
        var tempLen = allApiData.yelpBreakfastItemsGlobal.length;
        for (var i = 0; i < tempLen; i++) {
            if (userFoodCost === 0) {
                allApiData.yelpBreakfastItemsGlobal[i].cost =
                    CONSTANTS.DEFAULT_YELP_COSTS[allApiData.yelpBreakfastItemsGlobal[i].numDollarSigns - 1];
            }
            else {
                allApiData.yelpBreakfastItemsGlobal[i].cost = userFoodCost;
            }
        }
        tempLen = allApiData.yelpLunchItemsGlobal.length;
        for (var i = 0; i < tempLen; i++) {
            if (userFoodCost === 0) {
                allApiData.yelpLunchItemsGlobal[i].cost =
                    CONSTANTS.DEFAULT_YELP_COSTS[allApiData.yelpLunchItemsGlobal[i].numDollarSigns - 1];
            }
            else {
                allApiData.yelpLunchItemsGlobal[i].cost = userFoodCost;
            }
        }
        tempLen = allApiData.yelpDinnerItemsGlobal.length;
        for (var i = 0; i < tempLen; i++) {
            if (userFoodCost === 0) {
                allApiData.yelpDinnerItemsGlobal[i].cost =
                    CONSTANTS.DEFAULT_YELP_COSTS[allApiData.yelpDinnerItemsGlobal[i].numDollarSigns - 1];
            }
            else {
                allApiData.yelpDinnerItemsGlobal[i].cost = userFoodCost;
            }
        }
    }

    return allApiData;
}

function updateAllEventCosts(userEventCost, allApiData) {
    // This function sets all event costs that were not specifically set by the event api to whatever the user
    // chooses.
    if (allApiData !== null && allApiData !== undefined && !misc.isObjEmpty(allApiData)) {
        for (var i = 0; i < CONSTANTS.NUM_OF_EVENT_APIS; i++) { // cycle through meetup -> google places
            for (var j = 0; j < CONSTANTS.NUM_OF_EVENT_SLOTS; j++) { // cycle through event1 -> event4 itinerary slots
                var eventObj = allApiData[CONSTANTS.APIKEYS[i]][CONSTANTS.EVENTKEYS[j * 2]];
                if (eventObj) {
                    var lenEvents = eventObj.length;
                    for (var iEvent = 0; iEvent < lenEvents; iEvent++) {
                        var singleEventObj = allApiData[CONSTANTS.APIKEYS[i]][CONSTANTS.EVENTKEYS[j * 2]][iEvent];
                        if (singleEventObj.approximateFee) { // only update the cost if the event's cost is currently an approximate (ie not set by the api or not accurate)
                            allApiData[CONSTANTS.APIKEYS[i]][CONSTANTS.EVENTKEYS[j * 2]][iEvent].cost
                                = userEventCost;
                        }
                    }
                }

            }
        }
    }
    return allApiData;
}

function calcItineraryDistancesFromLocation2Location(resultsArray_in) {
    var len = resultsArray_in.length;
    var distances = [];
    var firstLocationFlag = true;
    var negative1 = -1.0;

    if (len > 0) {
        var latlongprev = {
            lat: 0.0,
            lng: 0.0,
        };
        var latlongcurr = {
            lat: 0.0,
            lng: 0.0,
        };
        for (var i = 0; i < len; i++) {

            if (firstLocationFlag) {
                if (resultsArray_in[i].origin.localeCompare(CONSTANTS.ORIGINS_EB) !== 0 &&
                    resultsArray_in[i].origin.localeCompare(CONSTANTS.ORIGINS_NONE) !== 0) {
                    firstLocationFlag = false;
                    distances.push(resultsArray_in[i].distance_from_input_location);
                    latlongprev = resultsArray_in[i].location;
                }
                else {
                    distances.push(negative1)
                }
            }
            else if (!firstLocationFlag) {
                if (resultsArray_in[i].origin.localeCompare(CONSTANTS.ORIGINS_EB) === 0 ||
                    resultsArray_in[i].origin.localeCompare(CONSTANTS.ORIGINS_NONE) === 0) {
                    distances.push(negative1);
                }
                else {
                    latlongcurr = resultsArray_in[i].location;
                    distances.push(misc.getDistanceFromLatLonInKm(latlongprev.lat, latlongprev.lng,
                        latlongcurr.lat, latlongcurr.lng));
                    latlongprev = resultsArray_in[i].location;
                }
            }
            else {
                distances.push(negative1);
            }
        }
        return distances;
    }
    else {
        return -1;
    }
}

Userinput.propTypes = {
    classes: PropTypes.object.isRequired,
    theme: PropTypes.object.isRequired,
}

Userinput.defaultProps = {}

export default Userinput;
