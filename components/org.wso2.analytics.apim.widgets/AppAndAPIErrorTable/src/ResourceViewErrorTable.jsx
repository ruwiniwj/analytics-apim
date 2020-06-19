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
import { FormattedMessage } from 'react-intl';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import PropTypes from 'prop-types';
import TableHead from '@material-ui/core/TableHead';
import Paper from '@material-ui/core/Paper';
import { Divider } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { ViewTypeEnum, ValueFormatType } from './Constants';

const styles = theme => ({
    table: {
        minWidth: 650,
        maxWidth: 650,
        minHeight: 400,
        marginBottom: 50,
    },
    selectEmpty: {
        marginTop: theme.spacing.unit * 2,
    },
    hover: {
        cursor: 'pointer',
    },
});

class ResourceViewErrorTable extends React.Component {
    constructor(props) {
        super(props);
        this.getTableHeadRowsForAPI = this.getTableHeadRowsForAPI.bind(this);
    }

    getTableHeadRowsForAPI() {
        const {
            viewType, valueFormatType, data, handleDrillDownClick, classes,
        } = this.props;
        return (
            <Table className={styles.table} aria-label='simple table'>
                <TableHead>
                    <TableRow>
                        { viewType === ViewTypeEnum.APP ? (
                            <TableCell>
                                <FormattedMessage id='table.column.app' defaultMessage='Application' />
                            </TableCell>
                        ) : '' }
                        <TableCell align='right'>
                            <FormattedMessage id='table.column.operation' defaultMessage='Operation' />
                        </TableCell>
                        <TableCell align='right'>
                            <FormattedMessage id='table.column.4xx' defaultMessage='4xx' />
                        </TableCell>
                        <TableCell align='right'>
                            <FormattedMessage id='table.column.5xx' defaultMessage='5xx' />
                        </TableCell>
                        <TableCell align='right'>
                            <FormattedMessage id='table.column.totalErrors' defaultMessage='Total Errors' />
                        </TableCell>
                        <TableCell align='right'>
                            <FormattedMessage id='table.column.totalFaulty' defaultMessage='Total Faulty' />
                        </TableCell>
                        <TableCell align='right'>
                            <FormattedMessage id='table.column.totalThrottled' defaultMessage='Total Throttled' />
                        </TableCell>
                        <TableCell align='right'>
                            <FormattedMessage id='table.column.totalSuccess' defaultMessage='Total Success' />
                        </TableCell>
                        <TableCell align='right'>
                            <FormattedMessage id='table.column.totalRequests' defaultMessage='Total Requests' />
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((row) => {
                        const {
                            applicationName, applicationOwner, apiResourceTemplate, apiMethod,
                        } = row;
                        let {
                            _4xx, _5xx, faultCount, throttledCount, successCount,
                        } = row;
                        const appName = applicationName + ' ( ' + applicationOwner + ' )';
                        const operation = apiResourceTemplate + ' ( ' + apiMethod + ' )';
                        let totalErrors = _4xx + _5xx;
                        const totalRequests = successCount + faultCount + throttledCount;
                        if (valueFormatType === ValueFormatType.PERCENT) {
                            _4xx = ((_4xx * 100) / totalRequests).toFixed(2) + ' %';
                            _5xx = ((_5xx * 100) / totalRequests).toFixed(2) + ' %';
                            totalErrors = ((totalErrors * 100) / totalRequests).toFixed(2) + ' %';
                            faultCount = ((faultCount * 100) / totalRequests).toFixed(2) + ' %';
                            throttledCount = ((throttledCount * 100) / totalRequests).toFixed(2) + ' %';
                            successCount = ((successCount * 100) / totalRequests).toFixed(2) + ' %';
                        }
                        return (
                            <TableRow
                                hover
                                key={{ apiResourceTemplate, apiMethod }}
                                onClick={() => handleDrillDownClick({
                                    applicationName, applicationOwner, apiResourceTemplate, apiMethod,
                                })}
                                className={classes.hover}
                            >
                                { viewType === ViewTypeEnum.APP ? (
                                    <TableCell>
                                        {appName}
                                    </TableCell>
                                ) : '' }
                                <TableCell align='right'>{operation}</TableCell>
                                <TableCell align='right'>{_4xx}</TableCell>
                                <TableCell align='right'>{_5xx}</TableCell>
                                <TableCell align='right'>{totalErrors}</TableCell>
                                <TableCell align='right'>{faultCount}</TableCell>
                                <TableCell align='right'>{throttledCount}</TableCell>
                                <TableCell align='right'>{successCount}</TableCell>
                                <TableCell align='right'>{totalRequests}</TableCell>
                            </TableRow>
                        );
                    })}
                    <TableRow />
                    <TableRow />
                </TableBody>
            </Table>
        );
    }

    render() {
        return (
            <div component={Paper}>
                <Divider m={10} />
                { this.getTableHeadRowsForAPI() }
            </div>
        );
    }
}

ResourceViewErrorTable.propTypes = {
    viewType: PropTypes.string.isRequired,
    valueFormatType: PropTypes.string.isRequired,
    data: PropTypes.instanceOf(Object).isRequired,
};

export default withStyles(styles)(ResourceViewErrorTable);
