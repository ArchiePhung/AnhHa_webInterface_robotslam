import React, { Component } from "react";
import {Container} from "react-bootstrap"

class Footer extends Component {
    state = {};
    render() {
        return (
            <Container className="text-center">
                <p>Ho Chi Minh City University of Technology &copy; 2024</p>
            </Container>
        );
    }
}

export default Footer;