import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import grey from '@material-ui/core/colors/grey';
import globalStyles from '../App.css';
import Slider from '@material-ui/lab/Slider';
import Typography from '@material-ui/core/Typography';
import Switch from '@material-ui/core/Switch';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import DialogContent from "@material-ui/core/DialogContent/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText/DialogContentText";
import Dialog from "@material-ui/core/Dialog/Dialog";
import DialogActions from "@material-ui/core/DialogActions/DialogActions";

const styles = theme => ({
    root: {
        position: 'relative',
    },
    paper: {
        position: 'absolute',
        top: 175,
        left: 150,
        width: '25%',
        padding: '1em',
        'z-index': 9999
    }
});

class ClickAway extends React.Component {

    constructor(props) {
        super(props);

        this.setWrapperRef = this.setWrapperRef.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.handleAllChange = this.handleAllChange.bind(this);
    }

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
            this.setState({ open: false });
        }
    }

    state = {
        open: false,
        value: false,
        eb: true,
        gp: true,
        mu: true,
        sg: true,
        all: true,
        prevEb: true,
        prevGp: true,
        prevMu: true,
        prevSg: true,
        prevAll: true,
    };

    handleClick = (filter_state) => {
        var objectState = {};
        var currentState = this.state[filter_state];
        objectState[filter_state] = !currentState;
        this.setState(objectState);
    };

    handleClickOutside(event) {
        if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
            this.setState({ 
                open: false,
                eb: this.state.prevEb,
                gp: this.state.prevGp,
                mu: this.state.prevMu,
                sg: this.state.prevSg,
                all: this.state.prevAll,
            });
        }
    }

    handleChange = name => event => {
        this.setState({ [name]: event.target.checked }, function () {
            if (!this.state.eb || !this.state.gp || !this.state.mu || !this.state.sg) {
                this.setState({ value: true });
            } else {
                this.setState({ value: false });
            }
        });
    };

    handleAllChange = name => event => {
        this.setState({ [name]: event.target.checked }, function () {
            // set everything to true if select all is toggled
            if (this.state.all) {
                this.setState({
                    value: true,
                    eb: true,
                    gp: true,
                    mu: true,
                    sg: true,
                    all: true,
                });
            }
            // set everything to false if 'select all' is switched to "off" 
            else {
                this.setState({
                    value: false,
                    eb: false,
                    gp: false,
                    mu: false,
                    sg: false,
                    all: false,
                });
            }
        });
    };

    handleApply = (props) => {
        // Handle what happens when 'Apply' button is pressed.
        // send back to userinput the eventFilterFlag for display and input into GA
        var muFlag, ebFlag, sgFlag, gpFlag, allFlag
        this.state.mu === true ? muFlag = 1 : muFlag = 0;
        this.state.eb === true ? ebFlag = 1 : ebFlag = 0;
        this.state.sg === true ? sgFlag = 1 : sgFlag = 0;
        this.state.gp === true ? gpFlag = 1 : gpFlag = 0;
        this.state.all === true ? allFlag = 1 : allFlag = 0;
        // Order in the eventFilterFlags variable is IMPORTANT!!
        var eventFilterFlags = [muFlag, ebFlag, sgFlag, gpFlag, allFlag]; // ordered left to right: meetup, eventbrite, seatgeek, google places, select/unselect all options
        this.props.setApiFilterFlags(eventFilterFlags);
        this.setState({
            open: false,
            prevEb: this.state.eb,
            prevGp: this.state.gp,
            prevMu: this.state.mu,
            prevSg: this.state.sg,
            prevAll: this.state.all,
        })
    };


    render() {
        const { classes } = this.props;
        const { open } = this.state
        const { value } = this.state;
        var disabled = this.props.resultsPresent;

        var buttonClasses = ['apiBtn'];

        this.state.value != 0 ? buttonClasses.push('activeStatebtn') : buttonClasses = ['apiBtn'];

        if (this.props.apiCalls) {
            this.props.handleResetFilter();
        }

        // reset filter when the api calls happen
        if (this.props.apiCalls) {
            this.setState({
                value: true,
                eb: true,
                gp: true,
                mu: true,
                sg: true,
                all: true,
            });
            var eventFilterFlags = [1, 1, 1, 1, 1]; // ordered left to right: meetup, eventbrite, seatgeek, google places, select/unselect all options
            this.props.setApiFilterFlags(eventFilterFlags);
        }

        return (
            <Dialog
                open={this.props.open}
                onClose={this.handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                className="filters"
                id="api-filter"
            >
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        <div ref={this.setWrapperRef}>
                            <Typography id="label">Include events & places from: </Typography>
                            <FormControl component="fieldset">
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={this.state.all}
                                                onChange={this.handleAllChange('all')}
                                                value="all"
                                                color="primary"
                                            />
                                        }
                                        label="Select All"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={this.state.eb}
                                                onChange={this.handleChange('eb')}
                                                value="eb"
                                                color="primary"
                                            />
                                        }
                                        label="Eventbrite"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={this.state.mu}
                                                onChange={this.handleChange('mu')}
                                                value="mu"
                                                color="primary"
                                            />
                                        }
                                        label="Meetup"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={this.state.gp}
                                                onChange={this.handleChange('gp')}
                                                value="gp"
                                                color="primary"
                                            />
                                        }
                                        label="Google Places"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={this.state.sg}
                                                onChange={this.handleChange('sg')}
                                                value="sg"
                                                color="primary"
                                            />
                                        }
                                        label="SeatGeek"
                                    />
                                </FormGroup>
                            </FormControl>
                            <Button    className={classes.button} onClick={this.handleApply}>
                                Apply
                            </Button>
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

ClickAway.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.element.isRequired,
};

export default withStyles(styles)(ClickAway);
