/*
 *  Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
import { FormattedMessage } from 'react-intl';
import { Scrollbars } from 'react-custom-scrollbars';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import ApiAvailability from './ApiAvailability';

/**
 * React Component for Api Availability widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Api Availability widget body
 */
export default function APIMApiAvailability(props) {
    const {
        themeName, height, availableApiData, legendData, inProgress,
    } = props;
    const styles = {
        headingWrapper: {
            height: '10%',
            margin: 'auto',
            width: '95%',
        },
        dataWrapper: {
            height: '75%',
            paddingTop: 35,
            margin: 'auto',
            width: '90%',
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
            margin: 'auto',
            marginTop: '5%',
        },
        loadingIcon: {
            margin: 'auto',
            display: 'block',
        },
        inProgress: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height,
        },
    };
    const availabilityProps = { availableApiData, legendData };

    return (
        <Scrollbars style={{ height }}>
            <div style={{
                backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
                height,
                margin: '15px',
                padding: '25px',
            }}>
                <div style={styles.headingWrapper}>
                    <h3 style={{
                        borderBottom: themeName === 'dark' ? '1px solid #fff' : '1px solid #02212f',
                        paddingBottom: '10px',
                        margin: 'auto',
                        marginTop: 0,
                        textAlign: 'left',
                        fontWeight: 'normal',
                        letterSpacing: 1.5,
                    }}
                    >
                        <FormattedMessage id='widget.heading' defaultMessage='API AVAILABILITY' />
                    </h3>
                </div>
                <div>
                    { inProgress ? (
                        <div style={styles.inProgress}>
                            <CircularProgress style={styles.loadingIcon} />
                        </div>
                    ) : (
                        <div>
                            { availableApiData.length === 0 ?
                                (
                                    <div style={styles.dataWrapper}>
                                        <Paper
                                            elevation={1}
                                            style={styles.paper}
                                        >
                                            <Typography variant='h5' component='h3'>
                                                <FormattedMessage id='nodata.error.heading'
                                                                  defaultMessage='No Data Available !' />
                                            </Typography>
                                            <Typography component='p'>
                                                <FormattedMessage
                                                    id='nodata.error.body'
                                                    defaultMessage={'No matching data available for the ' +
                                                    'selected options.'}
                                                />
                                            </Typography>
                                        </Paper>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{
                                            marginTop: '5%',
                                            // marginBottom: '5%',
                                            background: themeName === 'dark' ? '#162638' : '#f7f7f7',
                                            padding: '5%',
                                        }}
                                        >
                                            <ApiAvailability {...availabilityProps} />
                                            <Typography variant="caption" style={{ color: '#9e9e9e' }}>
                                                <FormattedMessage
                                                    id='chart.helper.text'
                                                    defaultMessage={'Please note that API availability is accurately' +
                                                    ' shown only when alerts are enabled. If alerts are disabled, ' +
                                                    'the chart will show as 100% availability.'}
                                                />
                                            </Typography>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    )}
                </div>
            </div>
        </Scrollbars>
    );
}

APIMApiAvailability.propTypes = {
    themeName: PropTypes.string.isRequired,
    height: PropTypes.string.isRequired,
    availableApiData: PropTypes.instanceOf(Object).isRequired,
    legendData: PropTypes.instanceOf(Object).isRequired,
};
