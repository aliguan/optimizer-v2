import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import React, { Component } from 'react';
import instagram from '../images/instagram-logo.png';
import facebook from '../images/facebook-logo.png';
import youtube from '../images/youtube.png';

export class Footer extends Component {
    constructor(props) {
        super(props);
    }



    render() {
        return (
            <div className="footer">
                <div class="footer-content">
                    <div className="row">
                        <div className="col-md-3">
                            <ul className="footer-1">
                                <li><strong>BLUE</strong> PLANIT</li>
                                <li>About Us</li>
                                <li><a href="http://blue-planit.com/" target="_blank">Blog</a></li>
                                <li>Contact</li>
                            </ul>
                        </div>
                        <div className="col-md-3">
                            <ul>
                                <li><strong>LEGAL</strong></li>
                                <li>Privacy</li>
                                <li>Terms</li>
                                <li>Site Map</li>
                            </ul>
                        </div>
                        <div className="col-md-3">
                            <ul className="footer-2">
                                <li><strong>POWERED BY</strong></li>
                                <li><a href="http://meetup.com">Meetup</a></li>
                                <li> <a href="http://eventbrite.com">Eventbrite</a></li>
                                <li><a href="http://google.com">Google Places</a></li>
                                <li><a href="http://seatgeek.com">Seatgeek</a></li>
                                <li><a href="http://yelp.com">Yelp</a></li>
                            </ul>
                        </div>
                        <div className="col-md-3">
                            <ul className="social-icons">
                                <li><strong>CONNECT WITH US</strong></li>
                                <div>
                                    <li className="hover-item"><i className="fab fa-facebook-square"></i></li>
                                    <li className="hover-item"><i className="fab fa-instagram"></i></li>
                                    <li className="hover-item"><i className="fab fa-youtube"></i></li>
                                </div>
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        )
    }
}

export default Footer;
