import React, { Component } from 'react';
import Scenarios from './../../../../../../constants/Scenarios';
import style from './style/scenarioform.scss';

class ScenarioForm extends Component {
    constructor(props) {
        super(props);

        this.state={
            scenario: null
        }
    }

    render() {
        const { submitScenarioForm } = this.props;

        const options = Object.keys(Scenarios).map(scenario => {
            return <React.Fragment key={ Scenarios[scenario] }>
                <input
                    id={ Scenarios[scenario] }
                    name="scenario"
                    type="checkbox"
                    value={ Scenarios[scenario] }
                />
                <label htmlFor={ Scenarios[scenario] }>{ Scenarios[scenario] }</label>
            </React.Fragment>;
        });

        return (
            <section className={ style.scenarioform }>
                <form onSubmit={ event => { submitScenarioForm(event) } } id="scenarioForm">
                    { options }
                    <button type="submit">Run scenario</button>
                </form>
            </section>
        );
    }
}

export default ScenarioForm;
