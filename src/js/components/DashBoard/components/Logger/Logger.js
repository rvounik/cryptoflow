import React, { Component } from 'react';
import style from './style/logger.scss';

class Logger extends Component {
    render() {
        const { messages } = this.props;

        return (
            <aside className={ style.logger }>
                <section>
                    <ul>
                        { messages.map((message, index) => {
                            return <li key={ index }>
                                <time dateTime={ message.timestamp }>{ message.timestamp }</time>
                                <span className={ style[message.type] }>{ message.message }</span>
                            </li>
                        }) }
                    </ul>
                </section>
            </aside>
        );
    }
}

export default Logger;











