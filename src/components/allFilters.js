import PriceFilter from "./priceFilter";
import DistanceFilter from "./distanceFilter";
import ApiFilter from "./apiFilter";
import CONSTANTS from "../constants";
import TimeFilter from "./timeFilter";
import MealFilter from "./mealFilter";
import React from "react";
import Button from '@material-ui/core/Button';

// this component serves as the dialog box that pops up when the location the user input is not valid.

class AllFilters extends React.Component {
    constructor(props) {
        super(props);

        // this.setWrapperRef = this.setWrapperRef.bind(this);
        this.handlePriceFilterDisplay = this.handlePriceFilterDisplay.bind(this);
        this.handleDistanceFilterDisplay = this.handleDistanceFilterDisplay.bind(this);
        this.handleApiFilterDisplay = this.handleApiFilterDisplay.bind(this);
        this.handleMealFilterDisplay = this.handleMealFilterDisplay.bind(this);
        this.handleTimeFilterDisplay = this.handleDistanceFilterDisplay.bind(this);
    }

    state = {
        openPrices: false,
        openDistance: false,
        openApi: false,
        openMeal: false,
        openTime: false
    };


    handlePriceFilterDisplay() {
        this.setState({openPrices:!this.state.openPrices});
    }

    handleDistanceFilterDisplay() {
        this.setState({openDistance:!this.state.openDistance});
    }

    handleApiFilterDisplay() {
        this.setState({openApi:!this.state.openApi});
    }

    handleMealFilterDisplay() {
        this.setState({openMeal:!this.state.openMeal});
    }
    
    handleTimeFilterDisplay() {
        this.setState({openTime:!this.state.openTime});
    }

    render() {

        return (
            <div>
                <div className="filters-div">
                    <Button onClick={this.handlePriceFilterDisplay}>Price</Button>
                    <Button onClick={this.handleDistanceFilterDisplay}>Distance</Button>
                    <Button onClick={this.handleApiFilterDisplay}>Source</Button>
                    {this.props.tabState == CONSTANTS.NAV_EVENT_TAB_ID ?
                        <Button onClick={this.handleTimeFilterDisplay}>Time</Button>
                        :
                        <Button onClick={this.handleMealFilterDisplay}>Meals</Button>
                    }

                    <PriceFilter open={this.state.openPrices}
                                 close={this.handlePriceFilterDisplay}
                                 setPriceRange={this.props.handlePriceFilter}>
                    </PriceFilter>
                    <DistanceFilter maxDistance={this.props.searchRadiusForFilterCompare}
                                    setDistance={this.props.setDistance}>
                                    openDistance={this.state.openDistance}
                                    close={this.handleDistanceFilterDisplay}
                    </DistanceFilter>
                    <ApiFilter  setApiFilterFlags={this.props.handleApiFilter}>
                                open={this.state.openApi}
                                close={this.handleApiFilterDisplay}
                    </ApiFilter>
                    {this.props.tabState == CONSTANTS.NAV_EVENT_TAB_ID ?
                        <TimeFilter setTimeRange={this.props.handleTimeFilter}>
                                    open={this.state.openTime}
                                    close={this.handleTimeFilterDisplay}
                        </TimeFilter> :
                        <MealFilter setMealFilterFlags={this.props.handleMealFilter}>
                                    open={this.state.openMeal}
                                    close={this.handleMealFilterDisplay}
                        </MealFilter>
                    }
                </div>
            </div>
        );
    }
}

export default AllFilters;
