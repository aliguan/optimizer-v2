import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from 'react';
import CONSTANTS from '../constants.js';
import misc from '../miscfuncs/misc.js';
import placeholder from '../images/placeholder.png';
import TooltipMat from '@material-ui/core/Tooltip';
import DescDialog from './descDialog.js'
import { Alert, AlertContainer } from 'react-bs-notifier';
import Button from '@material-ui/core/Button';
import Icon from "@material-ui/core/Icon/Icon";
import yelp_logo from '../images/yelp_burst.png';
import google_logo from '../images/google_places.png';
import meetup_logo from '../images/meetup_logo.png';
import eventbrite_logo from '../images/eventbrite_logo.png';
import seatgeek_logo from '../images/seatgeek_logo.png';

// This component constructs a single result that is displayed to the user from the api data
export class SingleResult extends Component {
    constructor(props) {
        super(props);
        this.state = {
            expanded: false,
            checked: true,
            isShowingInfoAlert: false,
        }
        this.handleClickDescOpen = this.handleClickDescOpen.bind(this);
        this.handleClickDescClose = this.handleClickDescClose.bind(this);
    }

    handleCheckBox = name => event => {
        this.setState({ [name]: event.target.checked });
    };

    handleAddEvent = (e) => {
        // if (e.target.checked) {
        var tempObj = this.props.itinItemObj;
        tempObj["other"] = this.props.eventKey;
        this.props.AddEvent(tempObj);
        // }
        this.onAlertToggle("isShowingInfoAlert");
    }

    handleClickDescOpen = () => {
        this.setState(state => ({ expanded: !state.expanded }));
    };

    handleClickDescClose() {
        this.setState({
            expanded: false,
        })
    }

    onAlertToggle(type) {        
		this.setState({
			[type]: !this.state[type]
		});
    }
    
    dismissAlert() {
        this.setState({
            isShowingInfoAlert: false,
        });
    }

    render() {
        var origin = this.props.itinItemObj.origin;
        var showImages = true;
        var key = this.props.key;
        var time = this.props.itinItemObj.time;
        var add_icon = <Icon onClick={this.handleAddEvent}>add</Icon>;
        var url = this.props.itinItemObj.url;
        var thumbnailUrl = this.props.itinItemObj.thumbnail;
        if (thumbnailUrl.localeCompare("") === 0) {
            thumbnailUrl = placeholder;
        }
        let truncate_name = 0;
        var name = this.props.itinItemObj.name;
        if (name) {
            var num_words_name = name.split(/\W+/).length;
            if (num_words_name > 9) {
                let result = name.split(/\W+/).slice(0, 10).join(" ");
                truncate_name = result + '...';
                truncate_name = <TooltipMat placement="top" title={name}><span>{truncate_name}</span></TooltipMat>
            }
        }
        var description = this.props.itinItemObj.description;
        description = misc.capFirstLetter(description);
        var shortenedDesc = description;
        var isShortDescHTML = false;
        var num_words_desc = 0;
        var descDialog = null;
        if (description) {
            shortenedDesc = shortenedDesc.substring(0, CONSTANTS.ITIN_CARD_DESC_STR_LENGTH) + '...';
            if (shortenedDesc.substring(0, 1).localeCompare('<') === 0) {
                isShortDescHTML = true;
            }
            num_words_desc = description.split(/\W+/).length;
            if (num_words_desc > 10) {
                descDialog = <DescDialog eventname={name}
                    open={this.state.expanded}
                    eventDesc={description}
                    handleClose={this.handleClickDescClose}></DescDialog>;
            }
        }

        var cost = this.props.itinItemObj.cost;
        var editCostHelperText = "";
        if (this.props.itinItemObj.time.localeCompare(CONSTANTS.FOODTIME_STR) === 0) {
            editCostHelperText = CONSTANTS.RESULTS_FOOD_COST_HELPER_TEXT;
        }
        else {
            if (this.props.itinItemObj.origin.localeCompare(CONSTANTS.ORIGINS_NONE) === 0) {
                editCostHelperText = "";
            }
            else if (!this.props.itinItemObj.approximateFee) {
                editCostHelperText = CONSTANTS.RESULTS_COST_HELPER_TEXT_EVENTSPEC;
            }
            else {
                if (this.props.userAddedEventCostFlag) {
                    editCostHelperText = CONSTANTS.RESULTS_COST_HELPER_TEXT_YOURS;
                }
                else {
                    editCostHelperText = CONSTANTS.RESULTS_COST_HELPER_TEXT;
                }
            }
        }

        var mealStr = CONSTANTS.EVENTKEYS[this.props.itinItemObj.original_itin_pos];
        var origins = {
            yelp: yelp_logo,
            places: google_logo,
            meetup: meetup_logo,
            eventbrite: eventbrite_logo,
            seatgeek: seatgeek_logo
        };

        return (
            <div>
                <AlertContainer position="bottom-left">
                    {this.state.isShowingInfoAlert ? (<Alert type="success" showIcon={false} timeout={CONSTANTS.NOTIF_DISMISS_TIME_MS} onDismiss={this.dismissAlert.bind(this)}>
                        Added to Itinerary Slot {this.props.eventKey + 1}</Alert>) : null}
                </AlertContainer>

                <div className="itinCardContainerDiv">
                    <div className="resultsCard">
                        <div className="resultsActions">
                            <div className="actionButtonDiv">
                                <Button className="elim-button" variant="contained" color="secondary">
                                    <label className="takeSpace">
                                        <TooltipMat placement="top" title={CONSTANTS.ADDTOITIN_TOOLTIP_STR}>
                                            {add_icon}
                                        </TooltipMat>
                                    </label>
                                    <input className="elim_checkbox"/> 
                                </Button>
                            </div>
                        </div>
                        {thumbnailUrl.localeCompare("") === 0 && showImages ? "" : <div className="resultsImgContainer"><a href={url} target='_blank'><img src={thumbnailUrl} /></a></div>}

                        <div className="resultsRowContent">
                            <div className="resultsName icon-name itinEventCol3">
                                <div>
                                    <span className="align">
                                        {url === "" ? <strong>{truncate_name ? truncate_name : name}</strong> :
                                            <strong><a href={url} target='_blank'>{truncate_name ? truncate_name : name}</a></strong>}
                                    </span>
                                    <div>
                                        <span>
                                            {time == 'Food' ?
                                                <div className="displayInline">
                                                    <strong>{mealStr}</strong><br />
                                                    <i className="fas fa-utensils"></i>
                                                </div>
                                                :
                                                <div className="displayInline">
                                                    <strong>{misc.convertMilTime(time)}</strong>
                                                </div>
                                            }
                                            {
                                                num_words_desc > 10 ? '' : (description === 0 || !description) ? '' : ' ' + description
                                            }
                                            {
                                                <div className="resultShortDesc">
                                                    {
                                                        ((origin.localeCompare(CONSTANTS.ORIGINS_EB) === 0 ||
                                                            origin.localeCompare(CONSTANTS.ORIGINS_MU) === 0) && !isShortDescHTML) ? shortenedDesc : ''
                                                    }

                                                </div>
                                            }

                                            {
                                                num_words_desc > 10 ?
                                                    <div id={'open-results-desc' + key} className="resultsBtn" onClick={this.handleClickDescOpen}>
                                                        <Button id={'readMoreButtonSingleResult'} className="descBtn" variant="contained" color="primary">
                                                            <span id={'readMoreSpanSingleResult'}>Read More</span>
                                                        </Button>
                                                    </div> : ''
                                            }
                                        </span>
                                        {descDialog}
                                    </div>
                                </div>
                            </div>

                            <div className="itinEventCol4 edit-cost text-warning">
                                <div className="costPanel">
                                    <div className="resultsCostDisplay">
                                        <strong>${cost}</strong>
                                    </div>
                                    <div className="EditCostHelperText">
                                        {editCostHelperText}
                                    </div>

                                </div>
                            </div>
                        </div>
                        <div className="resultsCardBottomDiv">
                                <div className="justify-end">
                                    <a href={url} >
                                        <img className="origin-logo" alt="" src={origins[origin]} />
                                    </a>
                                </div>
                            </div>                        
                    </div>

                </div>
            </div>
        )
    }
}

export default SingleResult;
