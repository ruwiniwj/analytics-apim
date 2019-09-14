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
import {
    defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
import Axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Widget from '@wso2-dashboards/widget';

import APIMApplicationApiUsage from './APIMApplicationApiUsage';

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

/**
 * Query string parameter
 * @type {string}
 */
const queryParamKey = 'appApiUsage';

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
 * Create React Component for APIM Application Api Usage widget
 * @class APIMApplicationApiUsageWidget
 * @extends {Widget}
 */
class APIMApplicationApiUsageWidget extends Widget {
    /**
     * Creates an instance of APIMApplicationApiUsageWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMApplicationApiUsageWidget
     */
    constructor(props) {
        super(props);
        this.styles = {
            loadingIcon: {
                margin: 'auto',
                display: 'block',
            },
            paper: {
                padding: '5%',
                border: '2px solid #4555BB',
            },
            paperWrapper: {
                margin: 'auto',
                width: '50%',
                marginTop: '20%',
            },
            loading: {
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            },
        };

        this.state = {
            width: this.props.width,
            height: this.props.height,
            limit: 5,
            applicationList: null,
            applicationSelected: null,
            usageData: null,
            legendData: null,
            localeMessages: null,
            inProgress: false,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.applicationSelectedHandleChange = this.applicationSelectedHandleChange.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);
        this.getApplicationList = this.getApplicationList.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
    }

    componentDidMount() {
        const { widgetID } = this.props;
        const locale = languageWithoutRegionCode || language;
        this.loadLocale(locale);
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
     * Load locale file.
     *
     * @param {string} locale Locale name
     * @memberof APIMApplicationApiUsageWidget
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMApplicationApiUsage/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     *
     * @param receivedMsg  message received from subscribed widgets
     * @memberof APIMApplicationApiUsageWidget
     * */
    handlePublisherParameters(receivedMsg) {
        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
            inProgress: true,
        }, this.getApplicationList);
    }

    /**
     * Formats the siddhi query - apiListQuery
     * @memberof APIMApplicationApiUsageWidget
     * */
    getApplicationList() {
        //todo get appliction list from store API
        const applicationList = [];
        const queryParam = super.getGlobalState(queryParamKey);
        let { applicationSelected, limit } = queryParam;
        if (!limit) {
            limit = 5;
        }
        if (!applicationSelected || !applicationList.some(application => application.appId === applicationSelected)) {
            if (applicationList.length > 0) {
                applicationSelected = applicationList[0].appId;
            }
        }
        this.setQueryParam(applicationSelected, limit);
        this.setState({ applicationList, applicationSelected, limit }, this.assembleMainQuery);
    }

    /**
     * Formats the siddhi query - mainquery
     * @memberof APIMApplicationApiUsageWidget
     * */
    assembleMainQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig,
        } = this.state;
        const queryParam = super.getGlobalState(queryParamKey);
        const { applicationSelected, limit } = queryParam;
        const { id } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        let query = dataProviderConfigs.configs.config.queryData.apiUsageQuery;

        query = query
            .replace('{{applicationId}}', applicationSelected)
            .replace('{{from}}', timeFrom)
            .replace('{{to}}', timeTo)
            .replace('{{per}}', perValue)
            .replace('{{limit}}', limit);
        dataProviderConfigs.configs.config.queryData.query = query;
        super.getWidgetChannelManager().subscribeWidget(id, this.handleDataReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof APIMApplicationApiUsageWidget
     * */
    handleDataReceived(message) {
        const { data } = message;

        if (data) {
            const usageData = data.map((dataUnit) => {
                return {
                    apiName: dataUnit[0],
                    version: dataUnit[1],
                    usage: dataUnit[2],
                };
            });
            const legendData = usageData.map((dataUnit) => {
                return { name: dataUnit.apiName };
            });
            this.setState({ usageData, legendData, inProgress: false });
        }
    }

    /**
     * Updates query param values
     * @param {string} applicationSelected - API Name menu option selected
     * @param {number} limit - data limitation value
     * @memberof APIMApplicationApiUsageWidget
     * */
    setQueryParam(applicationSelected, limit) {
        super.setGlobalState(queryParamKey, {
            applicationSelected,
            limit,
        });
    }

    /**
     * Handle Limit select Change
     * @param {Event} event - listened event
     * @memberof APIMApplicationApiUsageWidget
     * */
    handleLimitChange(event) {
        const { id } = this.props;
        const { applicationSelected } = this.state;

        this.setQueryParam(applicationSelected, parseInt(event.target.value));
        if (event.target.value) {
            this.setState({ inProgress: true, limit: event.target.value });
            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.assembleMainQuery();
        } else {
            this.setState({ limit: event.target.value });
        }
    }

    /**
     * Handle API name menu select change
     * @param {Event} event - listened event
     * @memberof APIMApplicationApiUsageWidget
     * */
    applicationSelectedHandleChange(event) {
        this.setState({ inProgress: true });
        const { limit } = this.state;
        const { id } = this.props;

        this.setQueryParam(event.target.value, limit);
        this.setState({ applicationSelected: event.target.value });
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleMainQuery();
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Application Usage widget
     * @memberof APIMApplicationApiUsageWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, width, limit, applicationSelected, usageData, legendData,
            applicationList, inProgress,
        } = this.state;
        const {
            loadingIcon, paper, paperWrapper, loading,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiUsersProps = {
            themeName,
            height,
            width,
            limit,
            applicationList,
            applicationSelected,
            usageData,
            legendData,
            inProgress,
        };

        if (!localeMessages || !usageData) {
            return (
                <div style={loading}>
                    <CircularProgress style={loadingIcon} />
                </div>
            );
        }

        return (
            <IntlProvider locale={languageWithoutRegionCode} messages={localeMessages}>
                <MuiThemeProvider
                    theme={themeName === 'dark' ? darkTheme : lightTheme}
                >
                    {
                        faultyProviderConfig ? (
                            <div
                                style={paperWrapper}
                            >
                                <Paper
                                    elevation={1}
                                    style={paper}
                                >
                                    <Typography variant='h5' component='h3'>
                                        <FormattedMessage
                                            id='config.error.heading'
                                            defaultMessage='Configuration Error !'
                                        />
                                    </Typography>
                                    <Typography component='p'>
                                        <FormattedMessage
                                            id='config.error.body'
                                            defaultMessage={'Cannot fetch provider configuration for APIM'
                                            + ' Application Usage widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMApplicationApiUsage
                                {...apiUsersProps}
                                applicationSelectedHandleChange={this.applicationSelectedHandleChange}
                                handleLimitChange={this.handleLimitChange}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMApplicationApiUsage', APIMApplicationApiUsageWidget);