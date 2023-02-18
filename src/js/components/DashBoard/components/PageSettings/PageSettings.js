import React, { Component } from 'react';
import style from './style/settings.scss';

class PageSettings extends Component {
    render() {
        return (
            <main className={ !this.props.active ? 'hidden' : '' }>
                <div className={ `${style.settings} ${!this.props.active ? 'hidden' : ''}` }>
                    <input type="checkbox" id="autoAddConfig"/>
                    <label htmlFor="sellWithLoss">
                        Sell thread at a loss of max .. % when open for ..
                    </label>
                    <br/>
                    <input type="checkbox" id="autoAddConfig"/>
                    <label htmlFor="autoAddConfig">
                        Automatically add best result from automated test to live config
                    </label>
                </div>
            </main>
        );
    }
}

export default PageSettings;
