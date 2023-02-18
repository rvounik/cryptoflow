import React, { Component } from 'react';
import style from './style/chart.scss';

class Chart extends Component {
    render() {
        const { id } = this.props;

        return (
            <canvas id={ id } className={ style.chart }>you need canvas</canvas>
        );
    }
}

export default Chart;











