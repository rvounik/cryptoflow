import React, { Component } from 'react';
import style from './style/threads.scss';

class Threads extends Component {
    render() {
        const { children } = this.props;

        return (
            <div className={ style.threadsContainer }>
                { children }
            </div>
        );
    }
}

export default Threads;
