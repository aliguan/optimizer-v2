import React, { Component } from 'react';
import PropTypes from 'prop-types'
// import logo from './logo.svg';
import './App.css';
import Userinput from './components/userinput.js';
import jquery from 'jquery';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

const muiTheme = getMuiTheme({
  slider: {
    selectionColor: '#3f51b5'
  },

});


class App extends Component {
    constructor(props) {
        super(props);
    }

  render() {
    return (
        <MuiThemeProvider muiTheme={muiTheme}>
            <div className="App clearfix background-color">
                <Userinput />
            </div>
        </MuiThemeProvider>
    );
  }
}

export default App;
