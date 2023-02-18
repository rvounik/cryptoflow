import React, { Component } from 'react';
import style from './style/feedback.scss';

class Feedback extends Component {
    render() {
        const { id } = this.props;

        return (
            <div id={ id } className={ style.feedbackContainer }/>
        );
    }
}

export default Feedback;
