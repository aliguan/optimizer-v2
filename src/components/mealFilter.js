import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

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
import Dialog from "@material-ui/core/Dialog/Dialog";
import DialogContent from "@material-ui/core/DialogContent/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText/DialogContentText";
import DialogActions from "@material-ui/core/DialogActions/DialogActions";

const styles = theme => ({
    root: {
        position: 'relative',
    },
    paper: {
        position: 'absolute',
        top: 175,
        left: 200,
        width: '25%',
        padding: '1em',
        'z-index': 9999
    }
});

class MealFilter extends React.Component {

    constructor(props) {
        super(props);

        this.setWrapperRef = this.setWrapperRef.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
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
        breakfast: true,
        lunch: true,
        dinner: true,
        all: true,
        prevBreakfast: true,
        prevLunch: true,
        prevDinner: true,
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
                breakfast: this.state.prevBreakfast,
                lunch: this.state.prevLunch,
                dinner: this.state.prevDinner,
                all: this.state.prevAll,
            });
        }
    }

    handleChange = name => event => {
        this.setState({ [name]: event.target.checked }, function () {
            if (!this.state.breakfast || !this.state.lunch || !this.state.dinner) {
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
                    breakfast: true,
                    lunch: true,
                    dinner: true,
                    all: true,
                });
            }
            // set everything to false if 'select all' is switched to "off" 
            else {
                this.setState({
                    value: false,
                    breakfast: false,
                    lunch: false,
                    dinner: false,
                    all: false,
                });
            }
        });
    };

    handleApply = (props) => {
        // Handle what happens when 'Apply' button is pressed.
        // send back to userinput for display and input into GA
        var mealFilterFlags = [this.state.breakfast, this.state.lunch, this.state.dinner, this.state.all];
        this.props.setMealFilterFlags(mealFilterFlags);
        this.setState({
            open: false,
            prevBreakfast: this.state.breakfast,
            prevLunch: this.state.lunch,
            prevDinner: this.state.dinner,
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
                breakfast: true,
                lunch: true,
                dinner: true,
                all: true,
            });
            var mealFilterFlags = [true, true, true, true];
            this.props.setMealFilterFlags(mealFilterFlags);
        }

        return (
            <Dialog
                open={this.props.open}
                onClose={this.handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                className="filters"
                id="meal-filter"
            >
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        <div ref={this.setWrapperRef}>
                            <Typography id="label">Include restaurants for: </Typography>
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
                                                checked={this.state.breakfast}
                                                onChange={this.handleChange('breakfast')}
                                                value="breakfast"
                                                color="primary"
                                            />
                                        }
                                        label="Breakfast"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={this.state.lunch}
                                                onChange={this.handleChange('lunch')}
                                                value="lunch"
                                                color="primary"
                                            />
                                        }
                                        label="Lunch"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={this.state.dinner}
                                                onChange={this.handleChange('dinner')}
                                                value="dinner"
                                                color="primary"
                                            />
                                        }
                                        label="Dinner"
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

MealFilter.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.element.isRequired,
};

export default withStyles(styles)(MealFilter);
