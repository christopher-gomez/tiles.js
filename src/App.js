/* eslint-disable */

import React from 'react';
import './App.css';
import { HashRouter as Router, Route } from "react-router-dom";
import { AnimatedSwitch } from 'react-router-transition';
import Splash from './Splash';
import Sandbox from './Sandbox';
import Docs from './Docs';

class App extends React.Component {
  render() {
    return (
      <Router basename='/'>
        <AnimatedSwitch
          atEnter={{ opacity: 0 }}
          atLeave={{ opacity: 0 }}
          atActive={{ opacity: 1 }}
          className="switch-wrapper"
        >
          <Route path="/" exact component={Splash} />
          <Route path="/sandbox" component={Sandbox} />
          <Route path='/docs' component={Docs}/>
        </AnimatedSwitch>
      </Router>
    )
  }
}

export default App;
