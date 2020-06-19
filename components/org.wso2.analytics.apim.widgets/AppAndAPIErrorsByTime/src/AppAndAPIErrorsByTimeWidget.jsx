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
import Widget from '@wso2-dashboards/widget';
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

import Axios from 'axios';
import {
    defineMessages, IntlProvider, FormattedMessage, addLocaleData,
} from 'react-intl';
import CircularProgress from '@material-ui/core/CircularProgress';

import { ViewTypeEnum, ValueFormatType, DrillDownEnum } from '../../AppAndAPIErrorTable/src/Constants';
import APIViewErrorTable from './APIViewErrorTable';
import CustomFormGroup from './CustomFormGroup';

const darkTheme = createMuiTheme({
    palette: {
        type: 'dark',
    },
    typography: {
        useNextVariants: true,
    },
    formControl: {
        minWidth: 120,
    },
});

const lightTheme = createMuiTheme({
    palette: {
        type: 'light',
    },
    typography: {
        useNextVariants: true,
    },
    formControl: {
        minWidth: 120,
    },
});

/**
 * Language
 * @type {string}
 */
const language = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;

/**
 * Language without region code
 */
const languageWithoutRegionCode = language.toLowerCase().split(/[_-]+/)[0];

/**
 * Create React Component for AppAndAPIErrorsByTime
 * @class AppAndAPIErrorsByTimeWidget
 * @extends {Widget}
 */
class AppAndAPIErrorsByTimeWidget extends Widget {
    /**
     * Creates an instance of AppAndAPIErrorsByTimeWidget.
     * @param {any} props @inheritDoc
     * @memberof AppAndAPIErrorsByTimeWidget
     */
    constructor(props) {
        super(props);
        this.state = {
            width: this.props.width,
            height: this.props.height,
            localeMessages: null,
            loading: true,

            viewType: ViewTypeEnum.API,
            valueFormatType: ValueFormatType.PERCENT,
            drillDownType: DrillDownEnum.API,

            selectedAPI: -1,
            selectedApp: -1,
            selectedVersion: -1,
            selectedResource: -1,
            selectedLimit: 5,
            data: [],

            apiList: [],
            appList: [],
            versionList: [],
            operationList: [],

        };

        this.styles = {
            // Insert styles Here
            heading: {
                margin: 'auto',
                textAlign: 'center',
                fontWeight: 'normal',
                letterSpacing: 1.5,
                paddingBottom: '10px',
                marginTop: 0,
            },
            headingWrapper: {
                margin: 'auto',
                width: '95%',
            },
            dataWrapper: {
                margin: 'auto',
                width: '95%',
            },
            title: {
                textAlign: 'center',
                marginTop: '100px',
                marginBottom: '50px',
                fontWeight: 'bold',
                letterSpacing: 1.5,
            },
            contentWrapper: {
                margin: '10px',
                marginTop: '0px',
            },
            root: {
                backgroundColor: this.props.muiTheme.name === 'light' ? '#fff' : '#0e1e34',
                padding: '20px',
            },
            formControl: {
                minWidth: '120px',
            },
            loadingIcon: {
                margin: 'auto',
                display: 'block',
            },
            loading: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: this.props.height,
            },
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.handleQueryResults = this.handleQueryResults.bind(this);
        this.assembleFetchDataQuery = this.assembleFetchDataQuery.bind(this);

        this.getQueryForAPI = this.getQueryForAPI.bind(this);

        this.loadApis = this.loadApis.bind(this);
        this.loadApps = this.loadApps.bind(this);
        this.loadVersions = this.loadVersions.bind(this);
        this.loadOperations = this.loadOperations.bind(this);

        this.handleLoadApis = this.handleLoadApis.bind(this);
        this.handleLoadApps = this.handleLoadApps.bind(this);
        this.handleLoadVersions = this.handleLoadVersions.bind(this);
        this.handleLoadOperations = this.handleLoadOperations.bind(this);

        this.handleAPIChange = this.handleAPIChange.bind(this);
        this.handleApplicationChange = this.handleApplicationChange.bind(this);
        this.handleVersionChange = this.handleVersionChange.bind(this);
        this.handleOperationChange = this.handleOperationChange.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);

        this.loadingDrillDownData = this.loadingDrillDownData.bind(this);

        this.renderDrillDownTable = this.renderDrillDownTable.bind(this);

        this.versionLoadCallBack = this.versionLoadCallBack.bind(this);
    }

    componentWillMount() {
        const locale = (languageWithoutRegionCode || language || 'en');
        this.loadLocale(locale).catch(() => {
            this.loadLocale().catch(() => {
                // TODO: Show error message.
            });
        });
    }

    componentDidMount() {
        const { widgetID } = this.props;
        // This function retrieves the provider configuration defined in the widgetConf.json
        // file and make it available to be used inside the widget
        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                }, () => super.subscribe(this.handlePublisherParameters));
            })
            .catch((error) => {
                console.error("Error occurred when loading widget '" + widgetID + "'. " + error);
                this.setState({
                    faultyProviderConfig: true,
                });
            });
    }

    componentWillUnmount() {
        const { id } = this.props;
        super.getWidgetChannelManager().unsubscribeWidget(id);
    }

    /**
      * Load locale file
      * @param {string} locale Locale name
      * @memberof AppAndAPIErrorsByTimeWidget
      * @returns {string}
      */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/AppAndAPIErrorsByTime/locales/${locale}.json`)
                .then((response) => {
                    // eslint-disable-next-line global-require, import/no-dynamic-require
                    addLocaleData(require(`react-intl/locale-data/${locale}`));
                    this.setState({ localeMessages: defineMessages(response.data) });
                    resolve();
                })
                .catch(error => reject(error));
        });
    }

    versionLoadCallBack() {
        const { versionList, operationList } = this.state;
        if (versionList.length > 0 && operationList.length > 0) {
            this.loadingDrillDownData();
        }
    }

    /**
     * Retrieve params from publisher
     * @param {string} receivedMsg Received data from publisher
     * @memberof AppAndAPIErrorsByTimeWidget
     * */
    handlePublisherParameters(receivedMsg) {
        const {
            from, to, granularity, apiName, apiID, operationID, appID,
        } = receivedMsg;

        if (from && to && granularity) {
            this.setState({
                // Insert the code to handle publisher data
                timeFrom: receivedMsg.from,
                timeTo: receivedMsg.to,
                perValue: receivedMsg.granularity,
            }, this.loadApis);
        }

        if (apiName && apiID && operationID) {
            const state = {
                selectedAPI: apiName,
                selectedVersion: apiID,
                selectedResource: operationID,
                versionList: [],
                operationList: [],
            };
            if (appID) {
                state.selectedApp = appID;
            }
            this.setState(state, () => {
                this.loadVersions(apiName);
                this.loadOperations(apiID);
            });
        }
    }


    // start of filter loading
    loadApps() {
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs = dataProviderConfigs.listAppsQueryConfigs;
        const { config } = dataProviderConfigs.configs;
        config.queryData.queryName = 'listAppsQuery';
        dataProviderConfigs.configs.config = config;
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_loadApps', widgetName, this.handleLoadApps, dataProviderConfigs);
    }

    loadApis() {
        this.loadingDrillDownData();
        this.loadApps();

        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'listApisQuery';
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_loadApis', widgetName, this.handleLoadApis, dataProviderConfigs);
    }

    loadVersions(selectedAPI) {
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'listVersionsQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{selectedAPI}}': selectedAPI,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_loadVersions', widgetName, this.handleLoadVersions, dataProviderConfigs);
    }

    loadOperations(selectedVersion) {
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'listOperationsQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{selectedVersion}}': selectedVersion,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_loadOperations', widgetName, this.handleLoadOperations, dataProviderConfigs);
    }

    handleLoadApps(message) {
        const { data, metadata: { names } } = message;
        const newData = data.map((row) => {
            const obj = {};
            for (let j = 0; j < row.length; j++) {
                obj[names[j]] = row[j];
            }
            return obj;
        });

        if (data.length !== 0) {
            this.setState({ appList: newData });
        } else {
            this.setState({ appList: [] });
        }
    }

    handleLoadApis(message) {
        const { data } = message;
        this.setState({ apiList: data });
    }

    handleLoadVersions(message) {
        const { data, metadata: { names } } = message;
        const newData = data.map((row) => {
            const obj = {};
            for (let j = 0; j < row.length; j++) {
                obj[names[j]] = row[j];
            }
            return obj;
        });

        if (data.length !== 0) {
            this.setState({ versionList: newData }, this.versionLoadCallBack);
        } else {
            this.setState({ versionList: [] });
        }
    }

    handleLoadOperations(message) {
        const { data, metadata: { names } } = message;
        const newData = data.map((row) => {
            const obj = {};
            for (let j = 0; j < row.length; j++) {
                obj[names[j]] = row[j];
            }
            return obj;
        });

        if (data.length !== 0) {
            this.setState({ operationList: newData }, this.versionLoadCallBack);
        } else {
            this.setState({ operationList: [] });
        }
    }
    // end of filter loading


    // start data query functions
    assembleFetchDataQuery(selectPhase, groupByPhase, filterPhase) {
        this.setState({ loading: true });
        const {
            timeFrom, timeTo, perValue, providerConfig, selectedLimit,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;
        super.getWidgetChannelManager().unsubscribeWidget(id);

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'drillDownQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{limit}}': selectedLimit,
            '{{selectPhase}}': selectPhase.join(','),
            '{{groupByPhase}}': 'group by ' + groupByPhase.join(','),
            '{{querystring}}': filterPhase.length > 0 ? 'AND ' + filterPhase.join(' AND ') : '',
            '{{orderBy}}': 'order by AGG_TIMESTAMP asc',
        };
        // Use this method to subscribe to the endpoint via web socket connection
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleQueryResults, dataProviderConfigs);
    }

    /**
     * Formats data retrieved
     * @param {object} message - data retrieved
     * @memberof AppAndAPIErrorsByTimeWidget
     * */
    handleQueryResults(message) {
        // Insert the code to handle the data received through query
        const { data, metadata: { names } } = message;
        const newData = data.map((row) => {
            const obj = {};
            for (let j = 0; j < row.length; j++) {
                obj[names[j]] = row[j];
            }
            return obj;
        });

        if (data.length !== 0) {
            this.setState({ data: newData, loading: false });
        } else {
            this.setState({ data: [], loading: false });
        }
    }
    // end data query functions


    // start table data type query constructor
    loadingDrillDownData() {
        this.getQueryForAPI();
    }

    getQueryForAPI() {
        const {
            selectedAPI, selectedApp, selectedVersion, selectedResource, versionList, operationList, appList,
        } = this.state;
        const selectPhase = [];
        const groupByPhase = [];
        const filterPhase = [];

        if (selectedAPI !== -1) {
            filterPhase.push('apiName==\'' + selectedAPI + '\'');
        }
        if (versionList.length > 0 && selectedVersion !== -1) {
            const api = versionList.find(i => i.API_ID === selectedVersion);
            filterPhase.push('apiVersion==\'' + api.API_VERSION + '\'');
        }
        if (operationList.length > 0 && selectedResource > -1) {
            const operation = operationList.find(i => i.URL_MAPPING_ID === selectedResource);
            filterPhase.push('apiResourceTemplate==\'' + operation.URL_PATTERN + '\'');
            filterPhase.push('apiMethod==\'' + operation.HTTP_METHOD + '\'');
        }
        if (selectedApp !== -1) {
            const app = appList.find(d => d.APPLICATION_ID === selectedApp);
            filterPhase.push('applicationName==\'' + app.NAME + '\'');
            filterPhase.push('applicationOwner==\'' + app.CREATED_BY + '\'');
        }

        selectPhase.push('AGG_TIMESTAMP', 'sum(_4xx) as _4xx', 'sum(_5xx) as _5xx',
            'sum(successCount) as successCount',
            'sum(faultCount) as faultCount', 'sum(throttledCount) as throttledCount');
        groupByPhase.push('AGG_TIMESTAMP');
        this.assembleFetchDataQuery(selectPhase, groupByPhase, filterPhase);
    }

    // end table data type query constructor


    // start of handle filter change
    handleApplicationChange(event) {
        this.setState({ selectedApp: event.target.value }, this.loadingDrillDownData);
    }

    handleAPIChange(event) {
        this.setState({
            selectedAPI: event.target.value,
            versionList: [],
            operationList: [],
            selectedVersion: -1,
            selectedResource: -1,
        }, this.loadingDrillDownData);
        this.loadVersions(event.target.value);
    }

    handleVersionChange(event) {
        this.setState({
            selectedVersion: event.target.value,
            operationList: [],
            selectedResource: -1,
        }, this.loadingDrillDownData);
        this.loadOperations(event.target.value);
    }

    handleOperationChange(event) {
        this.setState({ selectedResource: event.target.value }, this.loadingDrillDownData);
    }

    handleLimitChange(event) {
        this.setState({ selectedLimit: event.target.value }, this.loadingDrillDownData);
    }

    // end of handle filter change

    renderDrillDownTable(props) {
        return (<APIViewErrorTable {...props} />);
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the AppAndAPIErrorsByTimeWidget
     * @memberof AppAndAPIErrorsByTimeWidget
     */
    render() {
        const {
            localeMessages, viewType, drillDownType, valueFormatType, data, loading,
            selectedAPI, selectedApp, selectedVersion, selectedResource, selectedLimit, apiList, appList,
            versionList, operationList,
        } = this.state;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;

        return (
            <IntlProvider
                locale={language}
                messages={localeMessages}
            >
                <MuiThemeProvider
                    theme={themeName === 'dark' ? darkTheme : lightTheme}
                >
                    <div style={this.styles.root}>
                        <div style={this.styles.contentWrapper}>
                            <div style={this.styles.headingWrapper}>
                                <h3 style={this.styles.heading}>
                                    <FormattedMessage
                                        id='widget.heading'
                                        defaultMessage='ERROR SUMMARY OVER TIME'
                                    />
                                </h3>
                            </div>
                            <div style={this.styles.dataWrapper}>
                                <CustomFormGroup
                                    viewType={viewType}
                                    valueFormatType={valueFormatType}
                                    drillDownType={drillDownType}

                                    selectedApp={selectedApp}
                                    selectedAPI={selectedAPI}
                                    selectedVersion={selectedVersion}
                                    selectedResource={selectedResource}
                                    selectedLimit={selectedLimit}

                                    apiList={apiList}
                                    appList={appList}
                                    versionList={versionList}
                                    operationList={operationList}

                                    handleApplicationChange={this.handleApplicationChange}
                                    handleAPIChange={this.handleAPIChange}
                                    handleVersionChange={this.handleVersionChange}
                                    handleOperationChange={this.handleOperationChange}
                                    handleLimitChange={this.handleLimitChange}
                                />

                                {!loading ? (
                                    <this.renderDrillDownTable
                                        data={data}
                                        viewType={viewType}
                                        valueFormatType={valueFormatType}
                                        drillDownType={drillDownType}
                                        themeName
                                    />
                                )
                                    : (
                                        <div style={this.styles.loading}>
                                            <CircularProgress style={this.styles.loadingIcon} />
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                    </div>
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

// Use this method to register the react component as a widget in the dashboard.
global.dashboard.registerWidget('AppAndAPIErrorsByTime', AppAndAPIErrorsByTimeWidget);
