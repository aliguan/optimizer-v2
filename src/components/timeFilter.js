import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import CONSTANTS from '../constants';
import 'rc-slider/assets/index.css';

import Slider from 'rc-slider';
import DialogContent from "@material-ui/core/DialogContent/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText/DialogContentText";
import Dialog from "@material-ui/core/Dialog/Dialog";
import DialogActions from "@material-ui/core/DialogActions/DialogActions";
const createSliderWithTooltip = Slider.createSliderWithTooltip;
const Range = createSliderWithTooltip(Slider.Range);

const styles = theme => ({
    root: {
        position: 'relative',
    },
    paper: {
        position: 'absolute',
        top: 175,
        width: '25%',
        maxWidth: '320px',
        padding: '1em 2em',
        textAlign: 'left',

    },
    slider: {
        zIndex: '9999',
    },
    header: {
        marginBottom: '2em',
        fontSize: '1em',
    },
    span: {
        float: 'right',
        color: CONSTANTS.PRIMARY_COLOR,
    },
    actions: {
        marginTop: '2em',
        fontSize: '0.9em',
    },
    apply: {
        float: 'right',
    },
    clear: {
        float: 'left',
    }
});

class TimeFilter extends React.Component {

    constructor(props) {
        super(props);

        this.setWrapperRef = this.setWrapperRef.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
    }

    state = {
        open: false,
        min: CONSTANTS.ABS_TIMEFILTER_MIN,
        max: CONSTANTS.ABS_TIMEFILTER_MAX,
        value: [CONSTANTS.DEFAULT_TIMEFILTER_MIN, CONSTANTS.DEFAULT_TIMEFILTER_MAX],
        prevMin: CONSTANTS.ABS_TIMEFILTER_MIN,
        prevMax: CONSTANTS.ABS_TIMEFILTER_MAX,
        timeRange: ['12:00 AM', '11:59 PM'],
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

    /**
     * Alert if clicked on outside of element
     */
    handleClickOutside(event) {
        if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
            this.setState({ 
                open: false, 
                value: [this.state.prevMin, this.state.prevMax],
            },this.setTimeRange);
        }
    }

    onSliderChange = (value) => {
        this.setState({
            value: value,
        }, this.setTimeRange);
    }

    setTimeRange = () => {
        var startTime = this.handleDisplay(this.state.value[0]);
        var endTime = this.handleDisplay(this.state.value[1]);
        this.setState({
            timeRange: [startTime, endTime]
        });
    }

    handleDisplay = (value) => {

        var timeStr = [];
        var timeOfDay = '';
        var time = '';

        if (value < CONSTANTS.NOON) {
            timeOfDay = 'AM';
            switch (value) {
                case 0:
                    time = '12:00';
                    break;
                default:
                    time = Math.round(value/100) + ':00'
            }
        } else {
            timeOfDay = 'PM';
            switch (value) {
                case CONSTANTS.NOON:
                    time = '12:00';
                    break;
                case CONSTANTS.ABS_TIMEFILTER_MAX:
                    time = '11:59';
                    break;
                default:
                    time = Math.round((value - CONSTANTS.NOON)/100) + ':00'
            }
        }

        timeStr.push(time);
        timeStr.push(timeOfDay);

        return timeStr.join(' ');
    }

    handleApply = (props) => {
        var minTimeFloat = parseFloat(this.state.value[0]);
        var maxTimeFloat = parseFloat(this.state.value[1])

        this.props.setTimeRange([minTimeFloat, maxTimeFloat])
        this.setState({
            open: false,
            value: [this.state.value[0], this.state.value[1]],
            prevMin: this.state.value[0],
            prevMax: this.state.value[1],
        })
    };

    handleClear = (props) => {
        this.props.setTimeRange([CONSTANTS.ABS_TIMEFILTER_MIN, CONSTANTS.ABS_TIMEFILTER_MAX,])
        this.setState({
            open: false,
            min: CONSTANTS.ABS_TIMEFILTER_MIN,
            max: CONSTANTS.ABS_TIMEFILTER_MAX,
            prevMin: CONSTANTS.ABS_TIMEFILTER_MIN,
            prevMax: CONSTANTS.ABS_TIMEFILTER_MAX,
            value: [CONSTANTS.DEFAULT_TIMEFILTER_MIN, CONSTANTS.DEFAULT_TIMEFILTER_MAX],
            timeRange: ['12:00 AM', '11:59 PM'],
        })
    };

    render() {
        const { classes } = this.props;

        var buttonClasses = ['apiBtn'];
        var active = false;

        if (this.state.value[0] != 4 || this.state.value[1] != 20) {
            active = true;
        } else {
            active = false;
        }
        active ? buttonClasses.push('activeStatebtn') : buttonClasses = ['apiBtn'];

        if (this.props.apiCalls) {
            this.props.handleResetFilter();
        }
    
        // reset filter when the api calls happen
        if (this.props.apiCalls) {
            this.props.setTimeRange([CONSTANTS.ABS_TIMEFILTER_MIN, CONSTANTS.ABS_TIMEFILTER_MAX,])
            this.setState({
                open: false,
                min: CONSTANTS.ABS_TIMEFILTER_MIN,
                max: CONSTANTS.ABS_TIMEFILTER_MAX,
                value: [CONSTANTS.DEFAULT_TIMEFILTER_MIN, CONSTANTS.DEFAULT_TIMEFILTER_MAX],
                timeRange: ['12:00 AM', '11:59 PM'],
            })
        }

        return (
            <Dialog
                open={this.props.open}
                onClose={this.handleClose}
            >
                <div>hi</div>
                <DialogContent>
                    <DialogContentText>
                        <div ref={this.setWrapperRef}>
                            <Typography className={classes.header}>Time <span className={classes.span}>{this.state.timeRange[0]} - {this.state.timeRange[1]}</span></Typography>
                            <Range allowCross={false}  value={this.state.value} className={classes.slider}
                                defaultValue={[CONSTANTS.DEFAULT_TIMEFILTER_MIN, CONSTANTS.DEFAULT_TIMEFILTER_MAX]}
                                min={this.state.min} max={this.state.max}
                                step={CONSTANTS.TIME_FILTER_STEP}
                                onChange={this.onSliderChange}
                                tipFormatter={this.handleDisplay}
                            />

                            <div className={classes.actions}>
                                <Button className={classes.button} onClick={this.handleClear}>
                                    Clear
                                </Button>
                                <Button className={classes.button} onClick={this.handleApply}>
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.props.close} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

TimeFilter.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(TimeFilter);
