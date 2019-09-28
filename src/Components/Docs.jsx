/* eslint-disable */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import DocsMD from './docs.md';

export default class Docs extends React.Component {
  state = {
    docu: 'Documentation'
  };
  componentDidMount() {
    fetch(DocsMD).then(response => {
      return response.text()
    }).then(text => {
      this.setState({ docu: text });
    }).catch(err => {
      console.log(err);
    });
  }
  render() {
    return (
      <div className='docs'>
        <ReactMarkdown source={this.state.docu} />
      </div>
    );
  }
}