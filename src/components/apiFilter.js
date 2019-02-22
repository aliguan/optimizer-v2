import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
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
    },
    content: {
        paddingBottom: '0px',
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
            this.props.close();
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
        });
        this.props.close();
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
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                className="filters"
                id="api-filter"
            >
                <div ref={this.setWrapperRef}>
                    <DialogContent>
                        <DialogContentText className={classes.content} id="alert-dialog-description">
                            <div>
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

                            </div>
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button className={classes.button} onClick={this.handleApply}>
                            Apply
                        </Button>
                    </DialogActions>
                </div>
            </Dialog>
        );
    }
}

ClickAway.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.element.isRequired,
};

export default withStyles(styles)(ClickAway);
