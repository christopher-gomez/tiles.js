/* eslint-disable */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import HTMLParser from 'react-markdown/plugins/html-parser';
import DocsMD from './docs.md';
import hljs from 'highlight.js';
import javascript from 'highlight.js/lib/languages/javascript';
import 'highlight.js/styles/tomorrow-night.css';
hljs.registerLanguage('javascript', javascript);
import { HashLink as Link } from 'react-router-hash-link';


export default class Docs extends React.Component {
  state = {
    docu: 'Documentation'
  };
  componentDidUpdate() {
    this.updateCodeSyntaxHighlighting();
  }
  updateCodeSyntaxHighlighting = () => {
    document.querySelectorAll("pre code").forEach(block => {
      hljs.highlightBlock(block);
    });
  };
  componentDidMount() {
    this.updateCodeSyntaxHighlighting();
    fetch(DocsMD).then(response => {
      return response.text()
    }).then(text => {
      this.setState({ docu: text });
    }).catch(err => {
      console.log(err);
    });
  }
  markdownLinkRenderer(props) {
    console.log(props.href);
    if (props.href.startsWith("#")) {
      const h = props.href;
      return <Link smooth to={h}>{props.children}</Link>
    } else if (props.href.startsWith('/')) {
      return <a href={props.href}>{props.children}</a>;
    } else {
      return  <a href={props.href} target="_blank" rel="nofollow noopener noreferrer">{props.children}</a>;
    }
  }
  render() {
    return (
      <div className="docs">
        <div id='main'>
        <ReactMarkdown
          renderers={{ link: this.markdownLinkRenderer }}
          plugins={[HTMLParser]}
          source={this.state.docu}
          />
        </div>
      </div>
    );
  }
}