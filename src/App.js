/* eslint-disable */

import React from 'react';
import './App.css';
import { HashRouter as Router, Route, } from "react-router-dom";
import { AnimatedSwitch } from 'react-router-transition';
import Splash from './Components/Splash';
import Sandbox from './Components/Sandbox';
import Docs from './Components/Docs';

class App extends React.Component {
  render() {
    return (
      <Router basename='/'>
          <Route path="/" exact component={Splash} />
          <Route path="/sandbox" component={Sandbox} />
          <Route path='/docs' component={Docs}/>
      </Router>
    )
  }
}

export default App;
