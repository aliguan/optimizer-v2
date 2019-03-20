import React, { Component } from 'react';
import axios from 'axios';

class emailService extends Component {
  sendEmail(data) {
      return axios.post(process.env.REACT_APP_EMAIL_ENDPOINT, {
          message: data.message,
          email: data.email,
          location: data.location,
          total: data.total,
      }).then((response) => {
          return response;
      })
  };
}

export default emailService;
