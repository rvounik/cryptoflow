import React, { Component } from 'react';
import style from './style/header.scss';

class Header extends Component {
    render() {
        return (
            <header className={ style.header }>
                <img src="assets/cryptoflow.png" width="100" alt="crypto flow"/>
                <div id="liveWallet" className={ style.liveWallet } />
                <div id="mood" className={ style.mood }>&#x1f634;</div>
            </header>
        );
    }
}

export default Header;
