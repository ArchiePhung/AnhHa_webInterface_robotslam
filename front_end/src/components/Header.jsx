import React from "react";
import {Navbar, Nav, Container} from "react-bootstrap"
import Connection from "./Connection";

const Header = props => {

    return (
        <Container>
            <Navbar bg="dark" variant="dark" expand="lg" collapseOnSelect>
                <Container>
                    <Navbar.Brand href="#home">King's Tech</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="mr-auto">
                            <Nav.Link href="/">Home</Nav.Link>
                            <Nav.Link href={(props.email!== '')? "/map" : "/empty"}>Map</Nav.Link>
                            {/* <Nav.Link href="/" onClick={handleOnClick}>Logout</Nav.Link> */}
                            <Nav.Link href="/history">History</Nav.Link>
                        </Nav>

                    </Navbar.Collapse>

                    {/* Component displayed at the end of the Navbar */}
                    <div className="d-flex align-items-center">
                        <p style={{ color: 'white', fontSize: '12px' }} >{props.email}</p>
                        <Connection />
                    </div>

                </Container>
            </Navbar>
        </Container>
    );
}

export default Header;