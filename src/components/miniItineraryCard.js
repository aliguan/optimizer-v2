import React, { Component } from 'react'
import CONSTANTS from '../constants.js'
import misc from '../miscfuncs/misc.js'

class MiniItineraryCard extends Component {
    constructor(props) {
        super(props);
        this.handleHover = this.handleHover.bind(this);
        this.handleLeave = this.handleLeave.bind(this);
    }

    handleHover(e) {
        this.props.handleItinCardMouseEnter(this.props.cardIndex);
    }
    handleLeave(e) {
        this.props.handleItinCardMouseLeave(this.props.cardIndex);
    }

    render() {
        var key = this.props.key;
        var i = this.props.cardIndex;
        var id = this.props.itineraryCardId;
        var resultsArray = this.props.resultsArray;
        var dataNumAttribute = this.props.dataNumAttribute;
        var truncate_name = this.props.truncate_name;
        var origins = this.props.origins;

        var url = resultsArray[i].url; //this.state.resultsArray[i].url
        var name = resultsArray[i].name;
        var origin = resultsArray[i].origin; // this.state.resultsArray[i].origin
        var cost = resultsArray[i].cost; //this.state.resultsArray[i].cost
        var itineraryLeftLineText = resultsArray[i].time;
        if (itineraryLeftLineText.localeCompare(CONSTANTS.FOODTIME_STR) === 0) {
            itineraryLeftLineText = CONSTANTS.FOODTIME_STR;
        }
        else {
            itineraryLeftLineText = misc.convertMilTime(itineraryLeftLineText);
        }

        return (
            <div>
                <div ref={(divElement) => this.divElement = divElement} className="itinCardContainerDiv" >
                    <div className="itineraryLeftLine"></div>
                    <div className="itinTimeInfoLeftLine">
                        {<span className="boldIt"><b>{itineraryLeftLineText}</b></span>}
                    </div>
                    <div className="showActions" key={key} id={"miniitinCard" + i + id} onMouseEnter={this.handleHover} onMouseLeave={this.handleLeave}>
                        <div className="miniItinRowContent" data-number={dataNumAttribute}>
                            <div className="resultsName icon-name itinEventCol3">
                                <div>
                                    <span className="align">
                                        {url === "" ? <strong>{truncate_name ? truncate_name : name}</strong> :
                                            <strong><a href={url} target='_blank'>{truncate_name ? truncate_name : name}</a></strong>}
                                    </span>
                                </div>
                            </div>

                                <div>
                                        <strong>${cost}</strong>
                                </div>
                            <div className="mini-justify-end">
                                <a href={url} >
                                    <img className="origin-logo" alt="" src={origins[origin]} />
                                </a>
                            </div>

                        </div>


                    </div>

                </div>
                <div className="miniItinCardsSpace"></div>
            </div>
        );
    }
}

export default MiniItineraryCard;




