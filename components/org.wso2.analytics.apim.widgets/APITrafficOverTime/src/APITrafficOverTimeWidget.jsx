/* eslint-disable require-jsdoc */
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

import { ViewTypeEnum, ValueFormatType, DrillDownEnum } from './Constants';
import APIViewErrorTable from './APIViewErrorTable';
import CustomFormGroup from './CustomFormGroup';
import Scrollbars from 'react-custom-scrollbars';

const darkTheme = createMuiTheme({
    palette: {
        type: 'dark',
    },
    typography: {
        useNextVariants: true,
    },
});

const lightTheme = createMuiTheme({
    palette: {
        type: 'light',
    },
    typography: {
        useNextVariants: true,
    },
});

const queryParamKey = 'latencyOverTime';

const CALLBACK_API = '-api';
const CALLBACK_VERSION = '-version';
const CALLBACK_OPERATION = '-operation';
const CALLBACK_TRAFFIC = '-latency';

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
 * @classAPITrafficOverTimeWidget
 * @extends {Widget}
 */
class APITrafficOverTimeWidget extends Widget {
    /**
     * Creates an instance ofAPITrafficOverTimeWidget.
     * @param {any} props @inheritDoc
     * @memberofAPITrafficOverTimeWidget
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

            selectedAPI: 'All',
            selectedVersion: 'All',
            selectedResource: 'All',
            selectedLimit: 10,
            data: [],

            apiList: [],
            versionList: [],
            operationList: [],

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

        this.loadApis = this.loadApis.bind(this);
        this.loadVersions = this.loadVersions.bind(this);
        this.loadOperations = this.loadOperations.bind(this);

        this.handleLoadApis = this.handleLoadApis.bind(this);
        this.handleLoadVersions = this.handleLoadVersions.bind(this);
        this.handleLoadOperations = this.handleLoadOperations.bind(this);

        this.handleAPIChange = this.handleAPIChange.bind(this);
        this.handleVersionChange = this.handleVersionChange.bind(this);
        this.handleOperationChange = this.handleOperationChange.bind(this);
        this.handleGraphQLOperationChange = this.handleGraphQLOperationChange.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);

        this.loadingDrillDownData = this.loadingDrillDownData.bind(this);

        this.renderDrillDownTable = this.renderDrillDownTable.bind(this);
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
        this.loadQueryParams();
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
        super.getWidgetChannelManager().unsubscribeWidget(id + CALLBACK_API);
        super.getWidgetChannelManager().unsubscribeWidget(id + CALLBACK_VERSION);
        super.getWidgetChannelManager().unsubscribeWidget(id + CALLBACK_OPERATION);
        super.getWidgetChannelManager().unsubscribeWidget(id + CALLBACK_TRAFFIC);
    }

    /**
      * Load locale file
      * @param {string} locale Locale name
      * @memberof APITrafficOverTimeWidget
      * @returns {string}
      */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APITrafficOverTime/locales/${locale}.json`)
                .then((response) => {
                    // eslint-disable-next-line global-require, import/no-dynamic-require
                    addLocaleData(require(`react-intl/locale-data/${locale}`));
                    this.setState({ localeMessages: defineMessages(response.data) });
                    resolve();
                })
                .catch(error => reject(error));
        });
    }

    /**
     * Retrieve the limit from query param
     * @memberof APITrafficOverTimeWidget
     * */
    loadQueryParams() {
        let {
            selectedAPI, selectedVersion, selectedResource, limit: selectedLimit,
        } = super.getGlobalState(queryParamKey);
        if (!selectedLimit || selectedLimit < 0) {
            selectedLimit = 10;
            super.setGlobalState(queryParamKey, {
                selectedAPI, selectedVersion, selectedResource, selectedLimit,
            });
        }
        if (!selectedAPI) {
            selectedAPI = 'All';
        }
        if (!selectedVersion) {
            selectedVersion = 'All';
        }
        if (!selectedResource) {
            selectedResource = 'All';
        }
        this.setState({
            selectedAPI, selectedVersion, selectedResource, selectedLimit,
        });
    }

    /**
     * Updates query param values
     * @memberof APITrafficOverTimeWidget
     * */
    setQueryParam(selectedAPI, selectedVersion, selectedResource, limit) {
        super.setGlobalState(queryParamKey, {
            selectedAPI, selectedVersion, selectedResource, limit,
        });
    }

    /**
     * Retrieve params from publisher
     * @param {string} receivedMsg Received data from publisher
     * @memberofAPITrafficOverTimeWidget
     * */
    handlePublisherParameters(receivedMsg) {
        const queryParam = super.getGlobalState('dtrp');
        const { sync } = queryParam;
        const {
            from, to, granularity, api, version, apiResourceTemplate, apiMethod,
        } = receivedMsg;
        let selectedResource;
        if (apiResourceTemplate && apiMethod) {
            const graphQLOps = ['MUTATION', 'QUERY', 'SUBSCRIPTION'];
            const isGraphQL = graphQLOps.includes(apiMethod);
            if (isGraphQL) {
                selectedResource = apiResourceTemplate.split(',').map(resource => resource + '_' + apiMethod);
            } else {
                selectedResource = apiResourceTemplate + '_' + apiMethod;
            }
        } else {
            selectedResource = 'All';
        }
        const { selectedLimit } = this.state;

        // Insert the code to handle publisher data
        if (from && api) {
            this.setState({
                timeFrom: from,
                timeTo: to,
                perValue: granularity,
                selectedAPI: api,
                selectedVersion: version,
                selectedResource: resource,
                loading: true,
            }, this.loadApis);
            super.setGlobalState(queryParamKey, {
                selectedAPI: api, selectedVersion: version, selectedResource, selectedLimit,
            });
        } else if (from) {
            this.setState({
                timeFrom: from,
                timeTo: to,
                perValue: granularity,
                loading: !sync,
            }, this.loadApis);
        } else if (api) {
            this.setState({
                selectedAPI: api,
                selectedVersion: version,
                selectedResource,
                loading: true,
            }, this.loadApis);
            super.setGlobalState(queryParamKey, {
                selectedAPI: api, selectedVersion: version, selectedResource, selectedLimit,
            });
        }
    }

    // start of filter loading
    loadApis() {
        const {
            providerConfig, selectedAPI, selectedVersion, selectedResource,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        this.loadingDrillDownData(selectedAPI, selectedVersion, selectedResource);
        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'listApisQuery';
        super.getWidgetChannelManager()
            .subscribeWidget(id + CALLBACK_API, widgetName, this.handleLoadApis, dataProviderConfigs);
    }

    loadVersions() {
        const { providerConfig, selectedAPI } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (selectedAPI && selectedAPI !== 'All') {
            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'listVersionsQuery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{selectedAPI}}': selectedAPI,
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id + CALLBACK_VERSION, widgetName, this.handleLoadVersions, dataProviderConfigs);
        }
    }

    loadOperations(apiType) {
        const { providerConfig, selectedVersion, versionList } = this.state;
        const { id, widgetID: widgetName } = this.props;
        if (selectedVersion && selectedVersion !== 'All') {
            // use == due to comparing int with string
            const api = versionList.find(dataUnit => dataUnit.API_VERSION === selectedVersion);
            const dataProviderConfigs = cloneDeep(providerConfig);
            if (apiType === 'APIProduct') {
                dataProviderConfigs.configs = dataProviderConfigs.listProductQueryConfigs;
                const { config } = dataProviderConfigs.configs;
                config.queryData.queryName = 'productOperationsQuery';
                dataProviderConfigs.configs.config = config;
            } else {
                dataProviderConfigs.configs.config.queryData.queryName = 'listOperationsQuery';
            }
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{apiID}}': api.API_ID,
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id + CALLBACK_OPERATION, widgetName, this.handleLoadOperations, dataProviderConfigs);
        }
    }

    handleLoadApis(message) {
        const { data, metadata: { names } } = message;
        const newData = data.map((row) => {
            const obj = {};
            for (let j = 0; j < row.length; j++) {
                obj[names[j]] = row[j];
            }
            return obj;
        });
        const { selectedAPI } = this.state;
        if (newData) {
            const availableApi = newData.find(dataUnit => dataUnit.API_NAME === selectedAPI);
            const apiList = newData.map((dataUnit) => { return dataUnit.API_NAME; });
            apiList.unshift('All');
            this.setState({ apiList, selectedAPI: availableApi ? selectedAPI : 'All' }, this.loadVersions);
        } else {
            this.setState({ apiList: [], loading: false });
        }
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
        if (newData) {
            newData.unshift({ API_VERSION: 'All' });
            // use == because comparing int with string
            this.setState({ versionList: newData, operationList: [] }, () => {
                if (newData[0] && newData[0].API_TYPE !== 'WS') {
                    this.loadOperations(newData[0].API_TYPE);
                }
            });
        } else {
            this.setState({ versionList: [], operationList: [], loading: false });
        }
    }

    handleLoadOperations(message) {
        const { data, metadata: { names } } = message;
        const { selectedResource } = this.state;
        const newData = data.map((row) => {
            const obj = {};
            for (let j = 0; j < row.length; j++) {
                obj[names[j]] = row[j];
            }
            return obj;
        })
            .map((item) => {
                item.id = item.URL_PATTERN + '_' + item.HTTP_METHOD;
                return item;
            });
        if (newData && newData.length > 0) {
            newData.unshift({URL_PATTERN: 'All', HTTP_METHOD: 'All', id: 'All'});
            this.setState({
                operationList: newData,
                selectedResource: selectedResource || 'All',
            });
        } else {
            this.setState({ operationList: newData, loading: false });
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
            .subscribeWidget(id + CALLBACK_TRAFFIC, widgetName, this.handleQueryResults, dataProviderConfigs);
    }

    /**
     * Formats data retrieved
     * @param {object} message - data retrieved
     * @memberofAPITrafficOverTimeWidget
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
        if (newData.length === 1) {
            const { timeFrom } = this.state;
            newData.unshift({
                AGG_TIMESTAMP: timeFrom,
                responseCount: 0,
                faultCount: 0,
                throttledCount: 0,
            });
        }
        if (newData.length !== 0) {
            this.setState({ data: newData, loading: false });
        } else {
            this.setState({ data: [], loading: false });
        }
    }
    // end data query functions


    // start table data type query constructor
    loadingDrillDownData(selectedAPI, selectedVersion, selectedResource) {
        const selectPhase = [];
        const groupByPhase = [];
        const filterPhase = [];

        const { operationList } = this.state;
        if (selectedAPI !== 'All') {
            filterPhase.push('apiName==\'' + selectedAPI + '\'');
        }
        if (selectedVersion && selectedVersion !== 'All') {
            filterPhase.push('apiVersion==\'' + selectedVersion + '\'');
        }
        if (Array.isArray(selectedResource)) {
            if (selectedResource.length > 0) {
                const opsString = selectedResource
                    .map(d => d.split('_')[0])
                    .sort()
                    .join(',');
                filterPhase.push('apiResourceTemplate==\'' + opsString + '\'');
                filterPhase.push('apiMethod==\'' + selectedResource[0].split('_')[1] + '\'');
            }
        } else if (selectedResource !== 'All') {
            const operation = selectedResource.split('_');
            if (operation) {
                filterPhase.push('apiResourceTemplate==\'' + operation[0] + '\'');
                filterPhase.push('apiMethod==\'' + operation[1] + '\'');
            }
        }
        selectPhase.push('AGG_TIMESTAMP', 'apiName', 'apiVersion', 'apiResourceTemplate', 'apiMethod',
            'sum(responseCount) as responseCount',
            'sum(faultCount) as faultCount',
            'sum(throttledCount) as throttledCount');
        groupByPhase.push('AGG_TIMESTAMP');
        this.assembleFetchDataQuery(selectPhase, groupByPhase, filterPhase);
    }

    // end table data type query constructor


    // start of handle filter change
    handleAPIChange(event) {
        let value;
        if (!event) {
            // handle clear dropdown
            value = 'All';
        } else {
            value = event.value;
        }
        const { selectedLimit } = this.state;
        this.loadingDrillDownData(value, 'All', 'All');
        this.setQueryParam(value, 'All', 'All', selectedLimit);
        this.setState({
            selectedAPI: value,
            selectedVersion: 'All',
            selectedResource: 'All',
            versionList: [],
            operationList: [],
            loading: true,
        },
            this.loadVersions);
    }

    handleVersionChange(event) {
        let selectedVersion;
        if (!event) {
            // handle clear dropdown
            selectedVersion = 'All';
        } else {
            const { value } = event;
            selectedVersion = value;
        }
        const { selectedAPI, selectedLimit } = this.state;
        this.loadingDrillDownData(selectedAPI, selectedVersion, 'All');
        this.setQueryParam(selectedAPI, selectedVersion, 'All', selectedLimit);
        this.setState({
            selectedVersion,
            selectedResource: 'All',
            operationList: [],
            loading: true,
        }, () => {
            const { versionList } = this.state;
            const selectedVersionObj = versionList.find(item => item.API_VERSION === selectedVersion);
            if (selectedVersionObj && selectedVersionObj.API_TYPE !== 'WS') {
                this.loadOperations(selectedVersionObj.API_TYPE);
            }
        });
    }

    handleOperationChange(event) {
        let value;
        if (!event) {
            // handle clear dropdown
            value = 'All';
        } else {
            value = event.value;
        }
        const {
            selectedAPI, selectedVersion, selectedLimit,
        } = this.state;

        this.loadingDrillDownData(selectedAPI, selectedVersion, value);
        this.setQueryParam(selectedAPI, selectedVersion, value, selectedLimit);
        this.setState({ selectedResource: value, loading: true });
    }

    handleGraphQLOperationChange(data) {
        let selectedResource;
        if (data == null || data.length === 0) {
            selectedResource = 'All';
        } else {
            const ids = data.map(row => row.value);
            selectedResource = ids;
        }
        const {
            selectedAPI, selectedVersion,
        } = this.state;
        this.setState({
            selectedResource,
        });
        this.loadingDrillDownData(selectedAPI, selectedVersion, selectedResource);
    }

    handleLimitChange(event) {
        const limit = (event.target.value).replace('-', '').split('.')[0];
        if (limit) {
            const { selectedAPI, selectedVersion, selectedResource } = this.state;
            this.loadingDrillDownData(selectedAPI, selectedVersion, selectedResource);
            this.setQueryParam(selectedAPI, selectedVersion, selectedResource, event.target.value);
            this.setState({ selectedLimit: limit, loading: true });
        } else {
            const { id } = this.props;
            super.getWidgetChannelManager().unsubscribeWidget(id + CALLBACK_TRAFFIC);
            this.setState({ selectedLimit: limit, data: [], loading: false });
        }
    }

    // end of handle filter change

    renderDrillDownTable(props) {
        return (<APIViewErrorTable {...props} />);
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render theAPITrafficOverTimeWidget
     * @memberofAPITrafficOverTimeWidget
     */
    render() {
        const {
            localeMessages, viewType, drillDownType, valueFormatType, data, loading,
            selectedAPI, selectedVersion, selectedResource, selectedLimit, apiList,
            versionList, operationList,
        } = this.state;
        const { muiTheme, height } = this.props;
        const themeName = muiTheme.name;
        const styles = {
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
            root: {
                height: '100%',
                backgroundColor: themeName === 'light' ? '#fff' : '#0e1e34',
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
            contentWrapper: {
                margin: '10px',
                marginTop: '0px',
                padding: '20px',
                paddingTop: '30px',
            },
        };
        return (
            <IntlProvider
                locale={language}
                messages={localeMessages}
            >
                <MuiThemeProvider
                    theme={themeName === 'dark' ? darkTheme : lightTheme}
                >
                    <div style={styles.root} id='traffic-over-time'>
                        <Scrollbars style={{
                            height,
                            backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
                        }}
                        >
                            <div style={styles.contentWrapper}>
                                <div style={styles.headingWrapper}>
                                    <h3 style={styles.heading}>
                                        <FormattedMessage
                                            id='widget.heading'
                                            defaultMessage='API USAGE OVER TIME'
                                        />
                                    </h3>
                                </div>
                                <CustomFormGroup
                                    viewType={viewType}
                                    valueFormatType={valueFormatType}
                                    drillDownType={drillDownType}

                                    selectedAPI={selectedAPI}
                                    selectedVersion={selectedVersion}
                                    selectedResource={selectedResource}
                                    selectedLimit={selectedLimit}

                                    apiList={apiList}
                                    versionList={versionList}
                                    operationList={operationList}

                                    handleAPIChange={this.handleAPIChange}
                                    handleVersionChange={this.handleVersionChange}
                                    handleOperationChange={this.handleOperationChange}
                                    handleGraphQLOperationChange={this.handleGraphQLOperationChange}
                                    handleLimitChange={this.handleLimitChange}
                                />
                                {!loading ? (
                                    <this.renderDrillDownTable
                                        data={data}
                                        viewType={viewType}
                                        valueFormatType={valueFormatType}
                                        drillDownType={drillDownType}
                                        themeName={themeName}
                                    />
                                )
                                    : (
                                        <div style={styles.loading}>
                                            <CircularProgress style={styles.loadingIcon} />
                                        </div>
                                    )
                                }
                            </div>
                        </Scrollbars>
                    </div>
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

// Use this method to register the react component as a widget in the dashboard.
global.dashboard.registerWidget('APITrafficOverTime', APITrafficOverTimeWidget);
