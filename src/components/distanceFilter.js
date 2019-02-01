import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Slider from '@material-ui/lab/Slider';
import Typography from '@material-ui/core/Typography';
import CONSTANTS from '../constants.js'
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
        left: 33,
        width: '25%',
        padding: '1em',
        'z-index': 9999
    }
});

class DistanceFilter extends React.Component {

    constructor(props) {
        super(props);
        this.setWrapperRef = this.setWrapperRef.bind(this);
    }

    state = {
        value: this.props.maxDistance,
        prevRadius: this.props.maxDistance,
        maxDistanceValue: this.props.maxDistance,
        prevMaxDistanceValue: -1.0,
        doApiCallState: true,
        prevDoApiCallState: true,
    };

    handleChange = (event, value) => {
        this.setState({ value });

        //change result display here
    };

    handleApply = (props) => {
        this.props.setDistance(this.state.value);
        this.setState({
            openRadius: false,
            prevRadius: this.state.value,
        })
    };

    setWrapperRef(node) {
        this.wrapperRef = node;
    }


    render() {
        const { classes } = this.props;
        const { value } = this.state;

        this.state.maxDistanceValue = this.props.maxDistance;

        if (this.props.apiCalls) {
            this.props.handleResetFilter();
        }

        if (this.state.prevMaxDistanceValue !== this.state.maxDistanceValue ||
            this.props.apiCalls) {
            this.state.value = this.state.maxDistanceValue;
            this.state.prevMaxDistanceValue = this.state.maxDistanceValue;                     
        }
        return (
            <Dialog
                open={this.props.open}
                onClose={this.handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                className="filters"
                id="distance-filter"
            >
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        <div ref={this.setWrapperRef}>
                            <Typography id="label">{CONSTANTS.RADIUS_FILTER_STR}</Typography>
                            <Slider value={value} min={0} max={this.props.maxDistance} step={1} onChange={this.handleChange} ref={distanceSlider => this.distanceSlider = distanceSlider} />
                            <Button className={classes.button} onClick={this.handleApply}>
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

DistanceFilter.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(DistanceFilter);
