/* eslint-disable */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import HTMLParser from 'react-markdown/plugins/html-parser';
import { Intro, TOC, Grid, Map, View, Interfaces } from './markdown/ref.js';
const docs = [Intro, Grid, Map, View, Interfaces];
import hljs from 'highlight.js';
import javascript from 'highlight.js/lib/languages/javascript';
import { HashLink as Link } from 'react-router-hash-link';
import './Docs.css';
import 'highlight.js/styles/tomorrow-night.css';
hljs.registerLanguage('javascript', javascript);

export default class Docs extends React.Component {
  state = {
    toc: null,
    combinedData: [],
    currSlide: 0,
    currKey: 'Installation'
  };
  componentDidMount() {
    fetch(TOC)
      .then(response => {
        return response.text();
      })
      .then(text => {
        this.setState({ toc: text });
      });
    for (let i in docs) {
      docs[i] = fetch(docs[i]).then(response => {
        return response.text();
      });
    }
    let combinedData = [];
    const self = this;
    Promise.all(docs).then(values => {
      for (let i in values) {
        combinedData.push(values[i]);
      }
      self.setState({ combinedData }, () => {
        self.updateCodeSyntaxHighlighting();
      });
    });
  }
  componentDidUpdate() {
    this.updateCodeSyntaxHighlighting();
  }
  updateCodeSyntaxHighlighting = () => {
    document.querySelectorAll('pre code').forEach(block => {
      hljs.highlightBlock(block);
    });
  };
  markdownLinkRenderer({ href, children }) {
    if (href.startsWith('#')) {
      const val = href.slice(1);
      const key = children[0].props.value;
      return (
        <div>
          {this.state.currKey === key ? (
            <span></span>
          ) : null}
          <a
            href={'#/docs'}
            id={key}
            onClick={() => this.setCurrSlide(key, val)}
          >
            {children}
          </a>
        </div>
      );
    } else if (href.startsWith('/')) {
      return <a href={href}>{children}</a>;
    } else {
      return (
        <a href={href} target="_blank" rel="nofollow noopener noreferrer">
          {children}
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
  setCurrSlide(key, curr) {
    this.setState({ currKey: key, currSlide: curr });
  }
  next() {
    const next = ++this.state.currSlide;
    this.setState({ currSlide: next });
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
              link: this.markdownLinkRenderer.bind(this),
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

        </div>
      </div>
    );
  }
}
