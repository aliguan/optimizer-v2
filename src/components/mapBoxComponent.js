import React, { Component } from 'react';
import CONSTANTS from '../constants.js'
import misc from '../miscfuncs/misc.js'
import ReactMapboxGl, { Marker, Popup } from "react-map-gl";
import MapBoxMarker from './mapBoxSubComponents/mapBoxMarker';
import MapBoxPopup from './mapBoxSubComponents/mapBoxPopup';


// Few important things to note:
// 1) the first time trying to get the map to show up, I had to npm install react and react-dom versions
//    that react-map-gl needed after npm install react-map-gl. These versions of react and react-dom were
//    lower than our current versions. package.json remained the same but the map showed up afterwrads.
//    maybe this wasn't real...
// 2) Map would not pan or zoom. What fixed this was the updateViewport function.

// markerHoverStates: {
//     showMarker: false,
//     iHover: 0, //ith itinerary item to show marker info when the card is hovered over
// },

//https://www.mapbox.com/pricing/
//webapps $0 for 50k map views/geocoding requests per month then $.5 per 1k views/requests after
const showPopupOnHoverOnItinCards = true; //easy toggle to turn on/off showing popups when hovering mouse over itinerary cards

export class MapBoxComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            lat: 34,
            lng: 5,
            allMarkers: [],
            viewport: {
                width: "100%",
                height: "100%",
                latitude: parseFloat(this.props.center.lat),
                longitude: parseFloat(this.props.center.lng),
                zoom: CONSTANTS.GMAPS_DEFAULT_ZOOM,
            },
            popupInfo: null,
        }

        this.generateMarkers = this.generateMarkers.bind(this);
        this.updateViewport = this.updateViewport.bind(this);
        this.renderMarker = this.renderMarker.bind(this);
        this.renderPopup = this.renderPopup.bind(this);
        this.onMapClick = this.onMapClick.bind(this);
    }    

    onMapClick() {
    }

    // this allows panning and zooming of the map
    updateViewport = (viewport) => {
        this.setState({ viewport });
    }

    renderMarker = (markerObj, index) => {
        return (
            <Marker
                key={`mapBoxMarker-${index}`}
                longitude={markerObj.coordinates[0]}
                latitude={markerObj.coordinates[1]} >
                <MapBoxMarker size={20} onClick={() => this.setState({ popupInfo: markerObj })} />
            </Marker>
        );
    }

    renderPopup(markerObj) {
        const { popupInfo } = this.state;
        // handle popup when hovering over itinerary cards
        if (markerObj && markerObj !== null) {
            return (
                <Popup tipSize={5}
                    anchor="top"
                    longitude={markerObj.coordinates[0]}
                    latitude={markerObj.coordinates[1]}
                    closeOnClick={false}
                    onClose={() => this.setState({ popupInfo: null })} >
                    <MapBoxPopup info={markerObj} />
                </Popup>
            );
        }
        // handle popup when clicking on the marker
        else if (popupInfo) {
            return (
                <Popup tipSize={5}
                    anchor="top"
                    longitude={popupInfo.coordinates[0]}
                    latitude={popupInfo.coordinates[1]}
                    closeOnClick={false}
                    onClose={() => this.setState({ popupInfo: null })} >
                    <MapBoxPopup info={popupInfo} />
                </Popup>
            );
        }
        // handle other actions
        else {
            return null;
        }


    }

    generateMarkers() {
        var allMarkers = [];
        var resultsArray = this.props.results;
        var markerHoverStates = this.props.markerHoverStates;
        var hoveredMarker = [];
        if (resultsArray) {
            if (resultsArray.length > 0) {
                for (var i = 0; i < this.props.results.length; i++) {
                    if (!isNaN(resultsArray[i].location.lng) && !isNaN(resultsArray[i].location.lat)) {
                        var coordinates = [resultsArray[i].location.lng, resultsArray[i].location.lat];
                        var popUpStr = (i + 1) + ". " + " " +
                            resultsArray[i].name + " (" + misc.convertMilTime(resultsArray[i].time) + ")";

                        var markerObj = {
                            coordinates,
                            popUpStr,
                        }
                        if (markerObj.coordinates[0] !== undefined &&
                            markerObj.coordinates[1] !== undefined) {
                            var marker = this.renderMarker(markerObj, i);
                            allMarkers.push(marker);

                            // this if functions to show popups on hover
                            if (markerHoverStates.iHover === i &&
                                markerHoverStates.showMarker && showPopupOnHoverOnItinCards) {
                                hoveredMarker.push(markerObj);
                            }
                        }
                    }
                }
            }
        }
        return {
            allMarkers: allMarkers,
            hoveredMarker: hoveredMarker,
        }
    }

    render() {
        // console.log("mapbox render!!!!")
        var mapMarkers = this.generateMarkers();
        var hoveredMarker = null;
        if (mapMarkers.hoveredMarker.length > 0 &&
            mapMarkers.hoveredMarker !== null &&
            mapMarkers.hoveredMarker !== undefined) {
            hoveredMarker = mapMarkers.hoveredMarker[0];
        }
        const API_KEY = process.env.REACT_APP_MAPBOX_API_KEY;
        return (
            <ReactMapboxGl className="mapboxComponentContainer"
                mapStyle={'mapbox://styles/mapbox/streets-v9'}
                {...this.state.viewport}
                onViewportChange={this.updateViewport}
                mapboxApiAccessToken={API_KEY}
            >
                {mapMarkers.allMarkers}
                {this.renderPopup(hoveredMarker)}
            </ReactMapboxGl>
        )
    }
}

export default MapBoxComponent;
