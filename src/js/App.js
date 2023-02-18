import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import DashBoard from './components/DashBoard/DashBoard';

// import global scss so it becomes available in all modules (without it, webpack will never parse global css)
import style from './../css/index.scss'; // eslint-disable-line no-unused-vars

/**
 * Renders the app
 * @returns {{}} app
 */
class App extends Component {
    render() {
        return (
            <React.Fragment>
                <DashBoard />
            </React.Fragment>
        );
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('app')
);
