import * as React from "react";
import { Col, Container, Row } from "reactstrap";
import "./Footer.scss";
import logo from "./img/CodechainLogo_White.svg";
import github from "./img/github.svg";
import gitter from "./img/gitter.svg";
import medium from "./img/medium.svg";
import telegram from "./img/telegram.svg";
import twitter from "./img/twitter.svg";

export default class Footer extends React.Component<any, any> {
  public render() {
    return (
      <div className="Footer">
        <Container>
          <Row>
            <Col md={7}>
              <div>
                <img src={logo} alt="" />
              </div>
              <div className="mt-4">
                <div>
                  <span className="font-weight-bold mr-3">Contact</span>
                  <span>Email us: support@kodebox.io</span>
                </div>
              </div>
              <div className="mt-2">
                <span>CodeChain and CodeChain logo are trademarks of Kodebox, Inc</span>
              </div>
            </Col>
            <Col md={5}>
              <div className="link-icon-container">
                <a rel="noopener noreferrer" target="_blank" href="https://github.com/CodeChain-io">
                  <img alt="" src={github} className="mr-3 mr-md-0 ml-0 ml-md-3 link-icon" />
                </a>
                <a
                  rel="noopener noreferrer"
                  target="_blank"
                  href="https://gitter.im/CodeChain-io/codechain"
                >
                  <img alt="" src={gitter} className="mr-3 mr-md-0 ml-0 ml-md-3 link-icon" />
                </a>
                <a
                  rel="noopener noreferrer"
                  target="_blank"
                  href="https://twitter.com/codechain_io"
                >
                  <img alt="" src={twitter} className="mr-3 mr-md-0 ml-0 ml-md-3 link-icon" />
                </a>
                <a rel="noopener noreferrer" target="_blank" href="https://medium.com/codechain">
                  <img alt="" src={medium} className="mr-3 mr-md-0 ml-0 ml-md-3 link-icon" />
                </a>
                <a rel="noopener noreferrer" target="_blank" href="http://t.me/codechain_protocol">
                  <img alt="" src={telegram} className="mr-3 mr-md-0 ml-0 ml-md-3 link-icon" />
                </a>
              </div>
            </Col>
          </Row>
          <div className="link-container">
            <div className="link-item-col">
              <a rel="noopener noreferrer" target="_blank" href="https://codechain.io/#feature">
                <span className="link-header">Why CodeChain</span>
              </a>
            </div>
            <div className="link-item-col">
              <a rel="noopener noreferrer" target="_blank" href="https://codechain.io/#platform">
                <span className="link-header">Platform</span>
              </a>
            </div>
            <div className="link-item-col">
              <a rel="noopener noreferrer" target="_blank" href="https://codechain.io/#contact">
                <span className="link-header">Contact</span>
              </a>
            </div>
            <div className="link-item-col">
              <a rel="noopener noreferrer" target="_blank" href="https://codechain.io/#about">
                <span className="link-header">About Us</span>
              </a>
            </div>
            <div className="link-item-col">
              <a rel="noopener noreferrer" target="_blank" href="https://codechain.io/#faq">
                <span className="link-header">How it Works</span>
              </a>
            </div>
            <div className="link-item-col">
              <a rel="noopener noreferrer" target="_blank" href="https://medium.com/codechain">
                <span className="link-header">Blog</span>
              </a>
            </div>
          </div>
        </Container>
      </div>
    );
  }
}
