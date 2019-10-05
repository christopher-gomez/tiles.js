/* eslint-disable */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import HTMLParser from 'react-markdown/plugins/html-parser';
import { Intro, TOC, Grid, Interfaces } from './markdown/ref.js';
import hljs from 'highlight.js';
import javascript from 'highlight.js/lib/languages/javascript';
import { HashLink as Link } from 'react-router-hash-link';
import './Docs.css';
import 'highlight.js/styles/tomorrow-night.css';
hljs.registerLanguage('javascript', javascript);

export default class Docs extends React.Component {
  state = {
    toc: null,
    combinedData: 'Documentation',
    currSlide: 0
  };
  componentDidMount() {
    this.updateCodeSyntaxHighlighting();
    this.init();
  }
  componentDidUpdate() {
    this.updateCodeSyntaxHighlighting();
  }
  init() {
    const tocRequest = fetch(TOC).then(function(response) {
      return response.text();
    });
    const introRequest = fetch(Intro).then(function(response) {
      return response.text();
    });
    const gridRequest = fetch(Grid).then(function(response) {
      return response.text();
    });
    const interfacesRequest = fetch(Interfaces).then(function(response) {
      return response.text();
    });
    var combinedData = [];
    const self = this;
    Promise.all([tocRequest, introRequest, gridRequest, interfacesRequest]).then(function(values) {
      const toc = values[0];
      for (let i = 1; i < values.length; i++) {
        combinedData.push(values[i]);
      }
      self.setState({ toc, combinedData });
    });
  }
  updateCodeSyntaxHighlighting = () => {
    document.querySelectorAll('pre code').forEach(block => {
      hljs.highlightBlock(block);
    });
  };
  markdownLinkRenderer(props) {
    if (props.href.startsWith('#')) {
      const h = props.href;
      return (
        <Link smooth to={h}>
          {props.children}
        </Link>
      );
    } else if (props.href.startsWith('/')) {
      return <a href={props.href}>{props.children}</a>;
    } else {
      return (
        <a href={props.href} target="_blank" rel="nofollow noopener noreferrer">
          {props.children}
        </a>
      );
    }
  }
  markdownCodeRenderer({ language, value }) {
    if (language === '') {
      return value;
    }
    const className = language && `language-${language}`;
    const code = React.createElement(
      'code',
      className ? { className: className } : null,
      value
    );
    return React.createElement('pre', {}, code);
  }
  next() {
    const next = ++this.state.currSlide;
    this.setState({ currSlide: next }, () => {
      console.log(next); 
    });
  }
  prev() {
    const prev = --this.state.currSlide;
    this.setState({ currSlide: prev });
  }
  render() {
    return (
      <div className="docs">
        <div className="toc">
          <ReactMarkdown
            renderers={{
              link: this.markdownLinkRenderer,
              code: this.markdownCodeRenderer
            }}
            plugins={[HTMLParser]}
            source={this.state.toc}
          />
        </div>
        <div className="main">
          <ReactMarkdown
            renderers={{
              link: this.markdownLinkRenderer,
              code: this.markdownCodeRenderer
            }}
            plugins={[HTMLParser]}
            source={this.state.combinedData[this.state.currSlide]}
          />
          <div className="footer">
            {this.state.currSlide > 0 ? (
              <button className="prev" onClick={this.prev.bind(this)}>
                Prev
              </button>
            ) : null}
            {this.state.currSlide < this.state.combinedData.length ? (
              <button className="next" onClick={this.next.bind(this)}>
                Next
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}
