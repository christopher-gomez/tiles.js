/* eslint-disable */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import HTMLParser from 'react-markdown/plugins/html-parser';
import { TOC } from './markdown/ref.js';
import * as docFiles from './markdown/ref';
import { Link } from 'react-router-dom';
import hljs from 'highlight.js';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import './Docs.css';
import 'highlight.js/styles/atelier-sulphurpool-light.css';
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);

export default class Docs extends React.Component {
  state = {
    toc: '',
    combinedData: [],
    currSlide: 0,
    currKey: 'Installation'
  };
  componentDidMount() {
    const self = this;
    fetch(TOC)
      .then(response => {
        return response.text();
      })
      .then(text => {
        self.setState({ toc: text });
      });
    let combinedData = [];
    let fetchedDocData = Object.keys(docFiles)
      .slice(1, Object.keys(docFiles).length)
      .map((key, index) => {
        return fetch(docFiles[key]).then(response => {
          return response.text();
        });
      });
    Promise.all(fetchedDocData).then(values => {
      for (let i in values) {
        combinedData.push(values[i]);
      }
      self.setState({ combinedData }, () => {
        self.updateCodeSyntaxHighlighting();
        //console.log(combinedData);
        //console.log(Object.keys(combinedData));
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
    document.querySelectorAll('p code').forEach(block => {
      hljs.highlightBlock(block);
      block.className = 'language-typescript hljs'
    });
  };
  markdownLinkRenderer({ href, children }) {
    if (href.startsWith('#')) {
      const slide = href.slice(1);
      const key = children[0].props.value;
      return (
        <p>
          {this.state.currKey === key ? <span></span> : null}
          <a
            href={'#/docs'}
            id={key}
            onClick={() => this.setCurrSlide(slide, key)}
          >
            {children}
          </a>
        </p>
      );
    } else if (href.startsWith('/')) {
      return <Link to={href}>{children}</Link>;
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
  setCurrSlide(currSlide, currKey) {
    this.setState({ currSlide, currKey });
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
              link: this.markdownLinkRenderer.bind(this),
              code: this.markdownCodeRenderer
            }}
            plugins={[HTMLParser]}
            source={this.state.combinedData[this.state.currSlide]}
          />
        </div>
        <div className="footer">
          {this.state.currSlide > 0 ? (
            <button className="prev" onClick={() => {
              this.setCurrSlide(this.state.currSlide - 1, this.state.currKey - 1);
            }}>Prev</button>
          ) : null}
          {this.state.currSlide < this.state.combinedData.length ? (
            <button
              className="next"
              onClick={() => {
                this.setCurrSlide(this.state.currSlide + 1, this.state.currKey + 1);
              }}
            >
              Next
            </button>
          ) : null}
        </div>
      </div>
    );
  }
}
