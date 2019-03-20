import React, { Component } from 'react'
import CONSTANTS from '../constants.js'
import Button from '@material-ui/core/Button';
import TooltipMat from '@material-ui/core/Tooltip';
import Message from './message.js';
import EmailModal from './emailModal.js';
import misc from '../miscfuncs/misc.js'
import Icon from "@material-ui/core/Icon/Icon";
import { IconButton } from '@material-ui/core';

class ItinerarySummary extends Component {
    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.openModal = this.openModal.bind(this);
    }

    handleSubmit() {
        this.props.handleSubmit();
    }

    openModal() {
        this.emailModal.openModal();
    }

    render() {
        var totalCostDisplayed = this.props.totalCostDisplayed;
        var message = this.props.message;
        var messageObject = this.props.messageObject;
        var location = this.props.location;
        var totalCost = this.props.totalCost;
        var resultsArray = this.props.resultsArray;
        var itinHeadStr = this.props.itinHeadStr;

        return (
            <div>
            <div className="itinerarySumInfoContainer" >
                <div className="itinHeader">
                    {itinHeadStr}
                </div>

                <div className="totalCost" key="totalCostDiv">
                    <div className="costStr"><strong>{CONSTANTS.APPROX_COST_STR}</strong></div>
                    <div className="cost">{totalCostDisplayed}</div>
                </div>
                <div>

                    <Message key={"messageComponent"} messageObj={messageObject} />
                </div>

                {/* Action buttons for search again */}
                <div className="itinHeaderContainer">
                    <div className="itinGoBtn">
                        <TooltipMat placement="bottom" title={CONSTANTS.SEARCHAGAIN_TOOLTIP_STR}>
                            <input className="btn btn-sm go-btn" type="submit" onClick={this.handleSubmit} value="Search Again!" />
                        </TooltipMat>
                    </div>
                    <div className="sendEmail">
                        <EmailModal location={location} totalCost={totalCost} resultsArray={resultsArray} onRef={ref => (this.emailModal = ref)} />
                        <TooltipMat placement="bottom" title={CONSTANTS.EMAIL_TOOLTIP_STR}>
                            <input className="btn btn-sm go-btn" type="button" value={CONSTANTS.EMAIL_ITINERARY_STR} onClick={this.openModal} />
                        </TooltipMat>
                    </div>
                </div>

                <div className="detailedItinButton">
                
                <Button onClick={this.props.handleToggleItinerary}>
                {this.props.showDetailedItinerary ?
                    <TooltipMat placement="bottom" title={CONSTANTS.COLLAPSE_TO_MINI_ITIN_DIPLAY_STR}>
                        <Icon>expand_less</Icon>
                    </TooltipMat> 
                : <TooltipMat placement="bottom" title={CONSTANTS.EXPAND_TO_FULL_ITIN_DIPLAY_STR}>
                    <Icon>expand_more</Icon>
                </TooltipMat>}            
                </Button>
                
                
                </div>
            </div >
            {this.props.showDetailedItinerary ? <div className="itinSpacer"></div>
            :<div className="miniItinSpacer"></div>}
            </div>
        );
    }
}

export default ItinerarySummary;




