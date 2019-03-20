import React, { Component } from 'react';
import {Modal, FormControl} from 'react-bootstrap';
import emailService from './emailService.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import Loader from './reactloading.js';
import Button from '@material-ui/core/Button';

class EmailModal extends Component {

    constructor() {
        super();

        this.state = {
            modalIsOpen: false,
            email: '',
            loading:  false,
            snackbar_show: false,
        };
        this.emailService = new emailService();
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.handleEmail = this.handleEmail.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        this.props.onRef(this);
    }

    componentWillUnmount() {
        this.props.onRef(undefined);
    }

    openModal() {
        this.setState({modalIsOpen: true});
    }

    closeModal() {
        this.setState({modalIsOpen: false});
    }


    handleChange(e) {
        this.setState({ email: e.target.value });
    }

    handleEmail(e) {
        this.setState({ loading: true });
        var geocoder = require('geocoder');
        e.preventDefault();
        var loc = this.props.location;
        var totalCost = this.props.totalCost;
        function getLocation() {
            return new Promise(function (resolve, reject) {
            geocoder.geocode(loc, function(err, lat_lon) {
                if (err) {
                  reject(false);
                  this.setState({ loading: false });
                } else {
                  resolve(lat_lon);
                }
            },{ key: process.env.REACT_APP_GOOGLE_API_KEY });
          });
          }

       let locate = getLocation();
       locate.then((located) => {

           var data = {
               message: this.props.resultsArray,
               email: this.state.email,
               location: located.results[0].formatted_address,
               total: totalCost,
           }

            this.emailService.sendEmail(data).then((sent) => {
                this.setState({ loading: false });
                if(sent.status == 200) {
                    alert(sent.data);
                   // <SimpleSnackbar open={this.state.snackbar_show} handleClose={this.handleClose}/>
                } else {
                    alert('email could not be sent');
                };
            });
       });


    }

    render() {

      return (
          <Modal show={this.state.modalIsOpen} onHide={this.closeModal}>

           <Modal.Header >
               <Modal.Title>Send My Itinerary</Modal.Title>
               <Button onClick={this.closeModal}>x</Button>
           </Modal.Header>
           { this.state.loading === true ?
               <div className="email-loader">
                   <Loader type="spinningBubbles" color="#6c757d">
                   </Loader>
                   <h6>Sending...</h6>
               </div>
            :
               <Modal.Body>
                   <FormControl
                       type="text"
                       value={this.state.email}
                       placeholder="Please enter your e-mail"
                       onChange={this.handleChange}
                    />
                <Button variant="contained" color="primary" className="btn btn-sm go-btn" onClick={this.handleEmail}>Send Email</Button>
               </Modal.Body>
            }

           <Modal.Footer>
             <Button onClick={this.closeModal}>Close</Button>
           </Modal.Footer>
         </Modal>
      );
    }
  }

export default EmailModal;
