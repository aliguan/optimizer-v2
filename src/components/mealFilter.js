import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
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
    },
    colorSwitchBase: {
        color: '#0066d2',
        '&$colorChecked': {
            color: '#0066d2',
            '& + $colorBar': {
                backgroundColor: '#0066d2',
            },
        },
    },
    colorBar: {color: '#0066d2',},
    colorChecked: {color: '#0066d2',},
});

class MealFilter extends React.Component {

    constructor(props) {
        super(props);

        this.setWrapperRef = this.setWrapperRef.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
    }

    state = {
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
            this.setState({
                breakfast: this.state.prevBreakfast,
                lunch: this.state.prevLunch,
                dinner: this.state.prevDinner,
                all: this.state.prevAll,
            });
            this.props.close();
        }
    }

    handleClick = (filter_state) => {
        var objectState = {};
        var currentState = this.state[filter_state];
        objectState[filter_state] = !currentState;
        this.setState(objectState);
    };

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
        });
        this.props.close();
    };

    render() {
        const { classes } = this.props;

        var disabled = this.props.resultsPresent;

        var buttonClasses = ['apiBtn'];

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
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                className="filters"
                id="meal-filter"
            >
                <div ref={this.setWrapperRef}>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            <div>
                                <Typography id="label">Include restaurants for: </Typography>
                                <FormControl component="fieldset">
                                    <FormGroup>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={this.state.all}
                                                    onChange={this.handleAllChange('all')}
                                                    value="all"
                                                    classes={{
                                                        switchBase: classes.colorSwitchBase,
                                                        checked: classes.colorChecked,
                                                        bar: classes.colorBar,
                                                    }}
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
                                                    classes={{
                                                        switchBase: classes.colorSwitchBase,
                                                        checked: classes.colorChecked,
                                                        bar: classes.colorBar,
                                                    }}
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
                                                    classes={{
                                                        switchBase: classes.colorSwitchBase,
                                                        checked: classes.colorChecked,
                                                        bar: classes.colorBar,
                                                    }}
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
                                                    classes={{
                                                        switchBase: classes.colorSwitchBase,
                                                        checked: classes.colorChecked,
                                                        bar: classes.colorBar,
                                                    }}
                                                />
                                            }
                                            label="Dinner"
                                        />
                                    </FormGroup>
                                </FormControl>
                            </div>
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button className="apply-btn" onClick={this.handleApply}>
                            Apply
                        </Button>
                    </DialogActions>
                </div>
            </Dialog>
        );
    }
}

MealFilter.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.element.isRequired,
};

export default withStyles(styles)(MealFilter);
