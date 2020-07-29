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
import Paper from '@material-ui/core/Paper';
import FormControl from '@material-ui/core/FormControl';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { FormattedMessage } from 'react-intl';
import IntegrationReactSelect from './IntegrationReactSelect';

// import Autocomplete from '@material-ui/lab/Autocomplete';

const styles = theme => ({
    table: {
        minWidth: 650,
        maxWidth: 650,
        marginBottom: 50,
    },
    formControl: {
        margin: theme.spacing.unit,
        minWidth: 120,
    },
    newFormControl: {
        margin: theme.spacing.unit,
        minWidth: 200,
    },
    autocomplete: {
        margin: theme.spacing.unit,
        minWidth: 400,
        width: '20%',
    },
    selectEmpty: {
        marginTop: theme.spacing.unit * 2,
    },
    root: {
        border: 0,
        margin: theme.spacing.unit,
        display: 'inline-flex',
        padding: 0,
        position: 'relative',
        minWidth: 120,
        flexDirection: 'column',
        verticalAlign: 'top',
    },
    formDiv: {
        paddingTop: 10,
    },
});

function CustomFormGroup(props) {
    const {
        classes, selectedApp, selectedAPI, selectedVersion, selectedResource, apiList, appList,
        versionList, operationList, selectedLimit, handleGraphQLOperationChange,
        handleApplicationChange, handleAPIChange, handleVersionChange, handleOperationChange, handleLimitChange,
    } = props;
    const graphQLOps = ['MUTATION', 'QUERY', 'SUBSCRIPTION'];
    const graphQL = operationList.length > 0 && !!operationList.find(op => graphQLOps.includes(op.HTTP_METHOD));
    return (
        <div component={Paper}>
            <div className={classes.formDiv}>
                <FormControl className={classes.newFormControl}>
                    <IntegrationReactSelect
                        options={appList}
                        value={selectedApp}
                        onChange={handleApplicationChange}
                        placeholder='Select Application'
                        getLabel={item => item.NAME + ' ( ' + item.CREATED_BY + ' )'}
                        getValue={item => item.APPLICATION_ID}
                    />
                </FormControl>
                <FormControl className={classes.newFormControl}>
                    <IntegrationReactSelect
                        options={apiList}
                        value={selectedAPI}
                        onChange={handleAPIChange}
                        placeholder='Select API'
                        getLabel={item => item.API_NAME}
                        getValue={item => item.API_NAME}
                    />
                </FormControl>
                <FormControl className={classes.newFormControl}>
                    <IntegrationReactSelect
                        options={versionList}
                        value={selectedVersion}
                        onChange={handleVersionChange}
                        placeholder='Select Version'
                        getLabel={item => item.API_VERSION}
                        getValue={item => item.API_ID}
                    />
                </FormControl>
                <FormControl className={classes.newFormControl}>
                    <IntegrationReactSelect
                        isMulti={graphQL}
                        options={operationList}
                        value={selectedResource}
                        onChange={graphQL ? handleGraphQLOperationChange : handleOperationChange}
                        placeholder='Select Operation'
                        getLabel={item => item.URL_PATTERN + ' ( ' + item.HTTP_METHOD + ' )'}
                        getValue={item => item.URL_MAPPING_ID}
                    />
                </FormControl>
                <div>
                    <FormControl className={classes.formControl}>
                        <TextField
                            id='limit-number'
                            label={<FormattedMessage id='limit' defaultMessage='Limit' />}
                            value={selectedLimit}
                            onChange={handleLimitChange}
                            type='number'
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </FormControl>
                </div>
            </div>
        </div>
    );
}

export default withStyles(styles)(CustomFormGroup);

CustomFormGroup.propTypes = {
    classes: PropTypes.func.isRequired,
    handleApplicationChange: PropTypes.func.isRequired,
    handleAPIChange: PropTypes.func.isRequired,
    handleVersionChange: PropTypes.func.isRequired,
    handleOperationChange: PropTypes.func.isRequired,
    handleGraphQLOperationChange: PropTypes.func.isRequired,
    handleLimitChange: PropTypes.func.isRequired,
    selectedApp: PropTypes.number.isRequired,
    selectedAPI: PropTypes.number.isRequired,
    selectedVersion: PropTypes.number.isRequired,
    selectedResource: PropTypes.number.isRequired,
    selectedLimit: PropTypes.number.isRequired,
    apiList: PropTypes.instanceOf(Object).isRequired,
    appList: PropTypes.instanceOf(Object).isRequired,
    versionList: PropTypes.instanceOf(Object).isRequired,
    operationList: PropTypes.instanceOf(Object).isRequired,
};
