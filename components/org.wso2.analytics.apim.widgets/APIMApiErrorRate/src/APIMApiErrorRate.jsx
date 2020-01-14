/*
 *  Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import { FormattedMessage } from 'react-intl';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { VictoryPie, VictoryLegend, VictoryTooltip } from 'victory';
import CustomTable from './CustomTable';

/**
 * Display API Alerts details
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Api Error Rate widget body
 */
export default function APIMApiErrorRate(props) {
    const {
        width, height, themeName, sorteddata, errorpercentage, legendData, tableData, isloading,
    } = props;
    const styles = {
        headingWrapper: {
            margin: 'auto',
            width: '95%',
        },
        paperWrapper: {
            height: '75%',
        },
        paper: {
            background: themeName === 'dark' ? '#969696' : '#E8E8E8',
            borderColor: themeName === 'dark' ? '#fff' : '#D8D8D8',
            width: '75%',
            padding: '4%',
            border: '1.5px solid',
            marginLeft: '5%',
        },
        inProgress: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height,
        },
        mainDiv: {
            backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
            height,
            margin: '10px',
            padding: '20px',
        },
        statDiv: {
            display: 'flex',
            flexWrap: 'wrap',
        },
        pieDiv: {
            width: width > 1000 ? '50%' : '100%',
            paddingTop: 30,
        },
        tableDiv: {
            width: width > 1000 ? '50%' : '100%',
            marginTop: '5px',
        },
        h3: {
            borderBottom: themeName === 'dark' ? '1px solid #fff' : '1px solid #02212f',
            paddingBottom: '10px',
            margin: 'auto',
            marginTop: 0,
            textAlign: 'left',
            fontWeight: 'normal',
            letterSpacing: 1.5,
        },
        flyoutStyle: {
            fill: '#000',
            fillOpacity: '0.5',
            strokeWidth: 1,
        },
        victoryTooltip: {
            fill: '#fff',
            fontSize: 25,
        },
        rowGutter: {
            top: 0,
            bottom: -10,
        },
        victoryLegend: {
            labels: {
                fill: '#9e9e9e',
                fontSize: 19,
            },
        },
        countdiv: {
            margin: 'auto',
            width: '95%',
            paddingTop: '20px',
            fontWeight: 'normal',
        },
    };

    return (
        <Scrollbars style={{ height }}>
            <div style={styles.mainDiv}>
                <div style={styles.headingWrapper}>
                    <h3 style={styles.h3}>
                        <FormattedMessage id='widget.heading' defaultMessage='API ERROR PERCENTAGE' />
                    </h3>
                </div>
                { isloading ? (
                    <div style={styles.inProgress}>
                        <CircularProgress />
                    </div>
                ) : (
                    <div>
                        { sorteddata.length > 0 ? (
                            <div style={styles.statDiv}>
                                <h3 style={styles.countdiv}>
                                        Total Error Percentage :
                                    {errorpercentage}
                                    {' '}
%
                                </h3>
                                <div style={styles.pieDiv}>
                                    <svg viewBox='-50 0 1000 500'>
                                        <VictoryPie
                                            labelComponent={(
                                                <VictoryTooltip
                                                    orientation='right'
                                                    pointerLength={0}
                                                    cornerRadius={2}
                                                    flyoutStyle={styles.flyoutStyle}
                                                    style={styles.victoryTooltip}
                                                />
                                            )}
                                            width={500}
                                            height={500}
                                            standalone={false}
                                            padding={50}
                                            colorScale='blue'
                                            data={sorteddata}
                                            x={d => d.apiName}
                                            y={d => d.count}
                                        />
                                        <VictoryLegend
                                            standalone={false}
                                            colorScale='blue'
                                            x={500}
                                            y={20}
                                            gutter={20}
                                            rowGutter={styles.rowGutter}
                                            style={styles.victoryLegend}
                                            data={legendData}
                                        />
                                    </svg>
                                </div>
                                <div style={styles.tableDiv}>
                                    <CustomTable
                                        data={tableData}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div style={styles.paperWrapper}>
                                <Paper
                                    elevation={1}
                                    style={styles.paper}
                                >
                                    <Typography variant='h5' component='h3'>
                                        <FormattedMessage
                                            id='nodata.error.heading'
                                            defaultMessage='No Data Available !'
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        )
                        }
                    </div>
                )}
            </div>
        </Scrollbars>
    );
}

APIMApiErrorRate.propTypes = {
    themeName: PropTypes.string.isRequired,
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    sorteddata: PropTypes.instanceOf(Object).isRequired,
    legendData: PropTypes.instanceOf(Object).isRequired,
    tableData: PropTypes.instanceOf(Object).isRequired,
    errorpercentage: PropTypes.number.isRequired,
    isloading: PropTypes.bool.isRequired,
};
