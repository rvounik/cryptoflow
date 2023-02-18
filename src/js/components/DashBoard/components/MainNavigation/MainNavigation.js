import React, { Component } from 'react';
import Pages from './../../../../constants/Pages';
import style from './style/mainnavigation.scss';

class MainNavigation extends Component {
    render() {
        const { switchPage, activePage } = this.props;

        const pages = Object.keys(Pages).map(page => {
            return <li
                key={ page }
                id={ Pages[page] }
                className={ activePage === Pages[page]
                    ? style.mainNavigationItem__active
                    : style.mainNavigationItem }
                onClick={ () => { switchPage(Pages[page]) } }
            >{ Pages[page] }</li>
        });

        return (
            <nav className={ style.mainNavigation }>
                <ul>
                    { pages }
                </ul>
            </nav>
        );
    }
}

export default MainNavigation;
