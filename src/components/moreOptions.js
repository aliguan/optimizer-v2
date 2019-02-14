import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import PropTypes from 'prop-types'
import CONSTANTS from '../constants.js'
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import misc from '../miscfuncs/misc.js';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Slider from '@material-ui/lab/Slider';
import Typography from '@material-ui/core/Typography';
import MenuItem from '@material-ui/core/MenuItem';
import Dialog from "@material-ui/core/Dialog/Dialog";
import DialogContent from "@material-ui/core/DialogContent/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText/DialogContentText";
import DialogActions from "@material-ui/core/DialogActions/DialogActions";

const styles = theme => ({
    root: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    formControl: {
        margin: theme.spacing.unit,
        minWidth: 450,
    },
    selectEmpty: {
        marginTop: theme.spacing.unit * 2,
    },
});


class MoreOptions extends Component {
    constructor(props) {
        super(props);
        this.handleApply = this.handleApply.bind(this);
        this.handleReset = this.handleReset.bind(this);
        this.handleEventTypeChange = this.handleEventTypeChange.bind(this);
        this.setWrapperRef = this.setWrapperRef.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
    }

    state = {
        foodCost: this.props.currentFoodCost,
        eventCost: this.props.currentEventCost,
        eventType: 0,
    };

    componentDidMount() {
        document.addEventListener('mousedown', this.handleClickOutside);
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside);
    }

    setWrapperRef(node) {
        this.wrapperRef = node;
    }

    handleClickOutside(event) {
        if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
            this.props.close();
        }
    }

    handleApply(event) {
        var userFoodCost = misc.round2NearestHundredth(parseFloat(this.state.foodCost));
        this.props.updateUserFoodCost(userFoodCost);
        var userEventCost = misc.round2NearestHundredth(parseFloat(this.state.eventCost));
        this.props.updateUserEventCost(userEventCost);
        this.props.updateEventTypeSearch(this.state.eventType);
    }

    handleReset(event) {
        this.props.updateUserFoodCost(0.0);
        this.props.updateUserEventCost(0.0);
        this.props.updateEventTypeSearch(0);
        this.setState({ 
            foodCost: 0.0,
            eventCost: 0.0,
            eventType: 0,
         });
    }

    handleEventTypeChange(event) {
        this.setState({
            eventType: event.target.value,
        })
    }

    handleFoodChange = (event, value) => {
        this.setState({ foodCost: value });
    };
    handleEventChange = (event, value) => {
        this.setState({ eventCost: value });
    };

    render() {
        return (
            <Dialog
                open={this.props.open}
                onClose={this.handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                className="filters"
                id="more-filter"
            >
                <div ref={this.setWrapperRef}>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            <div>
                                <div>
                                    <Paper >
                                        <Typography id="label">{CONSTANTS.MOREOPT_FOODSTRING}</Typography>
                                        <Slider value={this.state.foodCost} min={0} max={CONSTANTS.MOREOPT_MAXFOODPRICE}
                                            step={CONSTANTS.MOREOPT_FOODPRICESTEP}
                                            onChange={this.handleFoodChange} />
                                        ${this.state.foodCost}

                                    </Paper>
                                </div>
                                <div>
                                    <Paper >
                                        <Typography id="label">{CONSTANTS.MOREOPT_EVENTSTRING}</Typography>
                                        <Slider value={this.state.eventCost} min={0} max={CONSTANTS.MOREOPT_MAXEVENTPRICE}
                                            step={CONSTANTS.MOREOPT_EVENTPRICESTEP}
                                            onChange={this.handleEventChange} />
                                        ${this.state.eventCost}

                                    </Paper>

                                </div>
                                <div>
                                    <FormControl>
                                        <InputLabel>{CONSTANTS.EVENT_CUSTOMIZATION_STRING}</InputLabel>
                                        <Select
                                        value={this.state.eventType}
                                        onChange={this.handleEventTypeChange}>
                                            <MenuItem value={0}>{CONSTANTS.EVENTTYPE_SEARCHKEYS[0]}</MenuItem>
                                            <MenuItem value={1}>{CONSTANTS.EVENTTYPE_SEARCHKEYS[1]}</MenuItem>
                                            <MenuItem value={2}>{CONSTANTS.EVENTTYPE_SEARCHKEYS[2]}</MenuItem>
                                            <MenuItem value={3}>{CONSTANTS.EVENTTYPE_SEARCHKEYS[3]}</MenuItem>
                                            <MenuItem value={4}>{CONSTANTS.EVENTTYPE_SEARCHKEYS[4]}</MenuItem>
                                        </Select>
                                    </FormControl>
                                </div>

                                <Button    onClick={this.handleApply}>
                                    Apply
                            </Button>

                                <Button    onClick={this.handleReset}>
                                    Reset
                            </Button>
                            </div>
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.props.close} color="primary">
                            Close
                        </Button>
                    </DialogActions>
                </div>
            </Dialog>
        );
    }
}

export default MoreOptions;
