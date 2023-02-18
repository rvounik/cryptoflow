import React, { Component } from 'react';

// import constants
import Pages from './../../constants/Pages';

// import components
import Header from './components/Header/Header';
import MainNavigation from './components/MainNavigation/MainNavigation';
import PageLive from './components/PageLive/PageLive';
import PageTest from './components/PageTest/PageTest';
import PageSettings from './components/PageSettings/PageSettings';

class DashBoard extends Component {
    constructor(props) {
        super(props);

        this.state=({
            activePage: Pages.LIVE,
            testConfig: {},
            liveRates: [],
            runAutomatedTest: true // todo: should be connected with Settings page
        });

        this.switchPage = this.switchPage.bind(this);
        this.storeLiveRates = this.storeLiveRates.bind(this);
        this.storeTestConfig = this.storeTestConfig.bind(this);
        this.clearTestConfig = this.clearTestConfig.bind(this);
    }

    switchPage(page) {
        this.setState({
            activePage: page
        });
    }

    storeLiveRates(liveRates) {
        this.setState({
            liveRates
        });
    }

    storeTestConfig(testConfig) {
        this.setState({
            testConfig
        });
    }

    clearTestConfig() {
        this.setState({
            testConfig: {}
        });
    }

    render() {
        return (
            <React.Fragment>
                <Header />
                <MainNavigation switchPage={ this.switchPage } activePage={ this.state.activePage } />

                { /* since everything runs in parallel, there is no routing required */ }

                <PageLive
                    active={ this.state.activePage === Pages.LIVE }
                    testConfig={ this.state.testConfig }
                    storeLiveRates={ this.storeLiveRates }
                    runAutomatedTest={ this.state.runAutomatedTest }
                    clearTestConfig={ this.clearTestConfig }
                />

                <PageTest
                    active={ this.state.activePage === Pages.TEST }
                    liveRates={ this.state.liveRates }
                    storeTestConfig={ this.storeTestConfig }
                    runAutomatedTest={ this.state.runAutomatedTest }
                />

                <PageSettings active={ this.state.activePage === Pages.SETTINGS }/>

            </React.Fragment>
        );
    }
}

export default DashBoard;
