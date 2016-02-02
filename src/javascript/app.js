Ext.define("rally-iteration-health", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    config: {
        defaultSettings: {
            showDateForHalfAcceptanceRatio:  true,
            hideTaskMovementColumn: false,
            useSavedRanges: false,
            showVelocityVariation: false,
            previousIterations: 3,
            allowGroupByLeafTeam: false
        }
    },
    defaultNumIterations: 20,
    items: [
        {xtype:'container',itemId:'settings_box'},
        {xtype:'container',itemId:'criteria_box', layout: {type: 'hbox'}},
        {xtype:'container',itemId:'display_box'}
    ],
    
    launch: function() {
        this.logger.log("User Timezone",this.getContext().getUser().UserProfile.TimeZone);
        this.logger.log("Workspace Timezone",this.getContext().getWorkspace().WorkspaceConfiguration.TimeZone);

        this.healthConfig = Ext.create('Rally.technicalservices.healthConfiguration',{
            appId: this.getAppId(),
            listeners: {
                scope: this,
                rangechanged: this._refreshView,
                ready: this._initApp,
                context: this.getContext()
            }
        });
        this.healthConfig.updateSettings(this.getSettings());

    },
    _refreshView: function(){
        this.logger.log('_refreshView');
        if (this.down('rallygrid')){
            this.down('rallygrid').getView().refresh();
        }
    },
    _initApp: function(){

        var project_oid = this.getContext().getProject().ObjectID;

        var promises = [Rally.technicalservices.WsapiToolbox.fetchWsapiCount('Project',[{property:'Parent.ObjectID',value: project_oid}]),
                Rally.technicalservices.WsapiToolbox.fetchDoneStates()];

            Deft.Promise.all(promises).then({
            scope: this,
            success: function(results){
                this.down('#criteria_box').removeAll();
                this.logger.log('_initApp child project count:', results[0], 'Schedule States', results[1]);
                this.healthConfig.doneStates = results[1];
                if (results[0] == 0){
                    this._initForLeafProject(this._fetchIterationsForLeafTeam);
                } else if (this.getSetting('allowGroupByLeafTeam') === true) {
                    this._initForLeafProject(this._fetchIterationsForMultipleTeams);
                } else {
                    this.down('#criteria_box').add({
                        xtype:'container',
                        html:'This app is designed for use at the team level.' +
                        '<br/>Change the context selector to a leaf team node.'
                    });
                }
            },
            failure: function(msg){
                Rally.ui.notify.Notifier.showError({message: msg});
            }
        });
    },
    _initForLeafProject: function(iterationCallbackFn){
        this.down('#criteria_box').add({
            xtype: 'rallynumberfield',
            itemId: 'num-iterations',
            minValue: 1,
            maxValue: 20,
            fieldLabel: 'Number of Iterations',
            labelAlign: 'right',
            stateful: true,
            stateId: this.getContext().getScopedStateId('num-iterations'),
            stateEvents: ['change'],
            labelWidth: 150,
            value: this.defaultNumIterations,
            width: 200,
            listeners: {
                scope: this,
                change: iterationCallbackFn,
                staterestore: iterationCallbackFn
            }
        });

        var metric_store = Ext.create('Ext.data.Store', {
            fields: ['displayName', 'name'],
            data : [
                {"displayName":"By Points", "name":"points"},
                {"displayName":"By Count", "name":"count"}
            ]
        });

        this.down('#criteria_box').add({
            xtype: 'rallycombobox',
            itemId: 'cb-metric',
            fieldLabel: 'Metric:',
            labelAlign: 'right',
            store: metric_store,
            displayField: 'displayName',
            valueField: 'name',
            stateful: true,
            stateId: this.getContext().getScopedStateId('cb-metric'),
            stateEvents: ['change'],
            labelWidth: 75,
            width: 200,
            listeners: {
                scope: this,
                change: this._updateDisplay
            }
        });
    },
    _fetchIterationsForMultipleTeams: function(nbf){
        var today_iso = Rally.util.DateTime.toIsoString(new Date());

        /**
         * if we are at the leaf node, then just use the limit and page size to limit the iterations.  If we are not, then
         * we should load in the iterations for each project and pass those in as a filter.
         */
         this._loadIterations({

             filters: [{
                 property: 'EndDate',
                 operator: '<',
                 value: today_iso
             }],
             limit: 'Infinity',
             context: {
                 project: this.getContext().getProject()._ref,
                 projectScopeDown: true
             },
             sorters: [{
                 property: 'EndDate',
                 direction: 'DESC'
             }],
             groupField: 'Name',
             groupDir: 'ASC',
             getGroupString: function(record) {
                 return record.get('Project').Name;
             }

         });
    },
    _fetchIterationsForLeafTeam: function(nbf){

        var today_iso = Rally.util.DateTime.toIsoString(new Date()),
            num_iterations = nbf ? nbf.getValue() : this.defaultNumIterations;

        this._loadIterations({
            limit: num_iterations,
            pageSize: num_iterations,
            context: {
                project: this.getContext().getProject()._ref
            },
            sorters: [{
                property: 'EndDate',
                direction: 'DESC'
            }],
            filters: [{
                property: 'EndDate',
                operator: '<',
                value: today_iso
            }]
        });

    },
    _loadIterations: function(storeConfig){

        this.down('#display_box').removeAll();

        this.logger.log('_loadIterations', storeConfig, this);

        Rally.technicalservices.ModelBuilder.build('Iteration','IterationHealth').then({
            scope: this,
            success: function(model){
                storeConfig.model = model;
                storeConfig.fetch = ['ObjectID','Name','StartDate','EndDate','PlannedVelocity','Project','Children'];
                this.logger.log('_loadIterations', storeConfig);
                this.iterationHealthStore = Ext.create('Rally.data.wsapi.Store',storeConfig);

                this.iterationHealthStore.load({
                        scope: this,
                        callback: function(records, operation, success){
                            this.logger.log("IterationHealthStore callback: ", success, operation, records);
                            if (success){
                                this.filterIterations(this.iterationHealthStore);

                                var records = this.iterationHealthStore.getRecords();
                                if (records.length > 0) {
                                    this._loadCalculationData(records);
                                    this._updateDisplay();
                                } else {
                                    this.down('#display_box').removeAll();
                                    this.down('#display_box').add({
                                        xtype:'container',
                                        html:'0 iterations found for the selected scope.'
                                    });
                                    Rally.ui.notify.Notifier.showWarning({message: 'No Iteration Records found for the current project scope.'});
                                }
                            } else {
                                this.iterationHealthStore = null;
                                this.logger.log('IterationHealthStore failure', operation);
                                Rally.ui.notify.Notifier.showError({message: 'Error loading Iteration Health Store: ' + operation.error.errors.join(',')});
                            }
                        }
                });
            },
            failure: function(msg){
                this.logger.log(msg)
                Rally.ui.notify.Notifier.showError({message: msg});
            },
            scope: this
        });
    },
    _loadCalculationData: function(iterationRecords){

        var iterationOids = _.map(iterationRecords, function(rec){ return rec.get('ObjectID'); }),
            previousIterations = this.getSetting('previousIterations');

        this.logger.log('xxx _loadCalculationData', iterationRecords.length, iterationOids, previousIterations);
        var me = this;

        Deft.Chain.sequence([
            function() { return me._fetchIterationArtifacts(iterationOids)},
            function() { return me._fetchIterationCFD(iterationOids)}
        ], me).then({
            success: function(results){
                this.logger.log('Artifact and CFD fetch results', results);

                var calculator = Ext.create('Rally.technicalservices.IterationHealthBulkCalculator',{
                    iterationRecords: iterationRecords,
                    artifactRecords: results[0],
                    doneStates: this.healthConfig.doneStates,
                    cfdRecords: results[1]
                });

                _.each(this.iterationHealthStore.getRecords(), function(r){
                    var oid = r.get('ObjectID');

                    r.set('__previousIterationVelocities',calculator.getPreviousIterationVelocities(r,previousIterations));
                    r.set('__cfdRecords', calculator.getCFDByIteration(oid));
                    r.set('__iterationArtifacts', calculator.getArtifactsByIteration(oid))
                }, this);
                this._refreshModels(iterationRecords);
            },
            failure: function(msg){
                this.logger.log('Artifact and CFD failure', msg);
            },
            scope: this
        });
    },
    _refreshModels: function(records){
        var metric_type = this.down('#cb-metric') ? this.down('#cb-metric').getValue() : null,
            use_points = (metric_type == 'points'),
            skip_zero = this.healthConfig.skipZeroForEstimationRatio,
            velocity_variation_previous_iteration_count = this.getSetting('previousIterations');

        this.healthConfig.usePoints = use_points;

        _.each(records, function(r){
            r.calculate(use_points, skip_zero, velocity_variation_previous_iteration_count, this.healthConfig.doneStates);
        }, this);

    },
    _getColumnCfgs: function(){
        var config = this.healthConfig,
            column_cfgs = [];

        _.each(config.displaySettings, function(col, key){
            if (col.display){
                var cfg = {
                    dataIndex: key,
                    text: col.displayName || key,
                    scope: config,
                    align: col.colAlign || 'right',
                    editRenderer: false
                };

               cfg.listeners = {
                    scope: this,
                    headerclick: this._showColumnDescription
                };

                cfg.renderer = config.getRenderer(cfg.dataIndex);
                column_cfgs.push(cfg);
            }
        }, this);
        this.logger.log('_getColumnCfgs', column_cfgs);
        return column_cfgs;
    },
    _showColumnDescription: function(ct, column, evt, target_element, eOpts){
        if (this.dialog){
            this.dialog.destroy();
        }

        var tool_tip = this.healthConfig.getTooltip(column.dataIndex);

        var items = [{
                cls: 'ts_popover_description',
                xtype:'container',
                html: tool_tip
            }],
            adjustor = this.getAdjustor(column);
        if (adjustor){
            items.push(adjustor);
        }
        this.logger.log('_showColumnDesription', column.dataIndex);
        this.dialog = Ext.create('Rally.ui.dialog.Dialog',{
            defaults: { padding: 5, margin: 5 },
            closable: true,
            draggable: true,
            title: column.text,
            items: items
        });
        this.dialog.show();
    },
    getAdjustor: function(column){
        var config = this.healthConfig;

        if ( config.displaySettings[column.dataIndex] && config.displaySettings[column.dataIndex].range) {
            var ranges = config.displaySettings[column.dataIndex].range,
                colors = config.getRangeColors(ranges),
                field_label = config.getRangeLabel(ranges),
                values = [ranges[colors[0]] || 50,ranges[colors[1]] || 75];

            return {
                xtype:'multislider',
                fieldLabel: field_label,
                width: 400,
                values: values,
                increment: 5,
                minValue: 0,
                maxValue: 100,
                tipText:function(thumb){ return colors[thumb.index] + ": above " + thumb.value; },
                listeners: {
                    changecomplete: function(slider,new_value,thumb){
                        values[thumb.index] = new_value;
                        ranges[colors[thumb.index]] = new_value;
                        config.setRanges(column.dataIndex,ranges);

                    }
                }
            };
        }

        return null;
    },
    _updateDisplay: function(){
        var metric_type = this.down('#cb-metric') ? this.down('#cb-metric').getValue() : null,
            use_points = (metric_type == 'points');

        this.healthConfig.usePoints = use_points;

        this.logger.log('_updateDisplay', this.iterationHealthStore, metric_type, use_points);
        if (!this.iterationHealthStore || metric_type == null){
            return;
        }

        this._refreshModels(this.iterationHealthStore.getRecords());

        this._displayGrid(
            this.iterationHealthStore,
            this._getColumnCfgs()
        );
    },
    _showStatus: function(message){
        if (message) {
            Rally.ui.notify.Notifier.showStatus({
                message: message,
                showForever: true,
                closable: false,
                animateShowHide: false
            });
        } else {
            Rally.ui.notify.Notifier.hide();
        }
    },
    _fetchIterationArtifacts: function(oids){
        this._showStatus("Loading Velocity Data")
        var config = {
            models: ['Defect', 'UserStory','DefectSuite','TestSet'],
            fetch: ['ObjectID','PlanEstimate','ScheduleState','Iteration'],
            limit: 'Infinity'
        };
        return this._fetchChunkedDataByOid("Iteration.ObjectID", oids, 'Rally.data.wsapi.artifact.Store', config);
    },
    _fetchIterationCFD: function(oids){
        this._showStatus("Loading Iteration Cumulative Flow Data");
        var config = {
            model: 'IterationCumulativeFlowData',
            fetch: ['CardCount', 'CardEstimateTotal', 'CreationDate', 'IterationObjectID', 'TaskEstimateTotal', 'CardToDoTotal', 'CardState'],
            sorters: [{
                property: 'CreationDate',
                direction: 'ASC'
            }],
            limit: 'Infinity'
        };
        return this._fetchChunkedDataByOid("IterationObjectID", oids, 'Rally.data.wsapi.Store', config);
    },

    _fetchChunkedDataByOid: function(property, oids, storeType, config){
        var deferred = Ext.create('Deft.Deferred');

        var chunkSize = 25,
            idx = -1,
            chunks = [];

        if (oids.length < chunkSize){
            chunks[0] = _.map(oids, function(oid){ return {property: property, value: oid}; });
        } else {
            for(var i=0; i<oids.length; i++){
                if (i % chunkSize === 0){
                    idx++;
                    chunks.push([]);
                }
                chunks[idx].push({property: property, value: oids[i]});
            }
        }

        var promises = [],
            me = this;
        _.each(chunks, function(chunk){
            config.filters = Rally.data.wsapi.Filter.or(chunk);
            this.logger.log('_fetchChunkedDataByOid', config, config.filters.toString());
            var newConfig = Ext.clone(config);
            promises.push(function() { return me._fetchData(storeType, newConfig); });
        }, this);

        Deft.Chain.parallel(promises, this).then({
            success: function(results){
                this.logger.log('_fetchChunkedDataByOid CALLBACK', results);
                this._showStatus(null);
                deferred.resolve(_.flatten(results));
            },
            failure: function(msg){
                deferred.reject(msg);
            },
            scope: this
        });

        return deferred;
    },
    _fetchData: function(storeType, config){
        var deferred = Ext.create('Deft.Deferred');

        this.logger.log('_fetchData', storeType, config);
        Ext.create(storeType,config).load({
            callback: function(records, operation){
                this.logger.log('_fetchData CALLBACK', storeType, config, records, operation);
                if (operation.wasSuccessful()){
                    deferred.resolve(records);
                } else {
                    deferred.resolve('Error fetching data: ' + operation.error.errors.join(','))
                }
            },
            scope: this
        });
        return deferred;
    },
    _displayGrid: function(store, column_cfgs){
        this.down('#display_box').removeAll();

        var gridConfig = {
            xtype: 'rallygrid',
            store: store,
            sortableColumns: false,
            showPagingToolbar: false,
            enableBulkEdit: false,
            showRowActionsColumn: false,
            enableEditing: false,
            columnCfgs: column_cfgs
        };

        if (store.groupField){
            gridConfig.features = [{
                ftype: 'groupingsummary',
                groupHeaderTpl: '{name} ({rows.length})',
                startCollapsed: true
            }];
        }

        this.down('#display_box').add(gridConfig);
    },
    filterIterations: function(store){
        var  nbf = this.down('#num-iterations'),
            num_iterations = nbf ? nbf.getValue() : this.defaultNumIterations;


        //Get relevant Iteration Records
        var projectIterationHash = Rally.technicalservices.IterationHealthBulkCalculator.buildSortedIterationByProjectHash(store.getRecords()),
            iterationOids = [];

        _.each(projectIterationHash, function(recs, project){
            iterationOids = iterationOids.concat(_.map(recs, function(r){ return r.ObjectID; }).slice(0,num_iterations-1));
        });

        store.filterBy(function(item){
            return Ext.Array.contains(iterationOids, item.get('ObjectID'));
        });
    },
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },
    
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        Ext.apply(this, settings);
        this.launch();
    },
    getSettingsFields: function() {

        var settings = [],
            display_half_accepted = false,
            half_accepted_ratio_name = '__halfAcceptedRatio',
            task_churn_name = "Task Churn",
            velocity_variance_name = "Velocity Variance";

        if (this.healthConfig){
            display_half_accepted= this.healthConfig.displaySettings.__halfAcceptedRatio.display;
            half_accepted_ratio_name = this.healthConfig.displaySettings.__halfAcceptedRatio.displayName;
            task_churn_name = this.healthConfig.displaySettings.__taskChurn.displayName;
            velocity_variance_name = this.healthConfig.displaySettings.__velocityVariance.displayName;
        }

        if (display_half_accepted){
            settings.push({
                    name: 'showDateForHalfAcceptanceRatio',
                    xtype: 'rallycheckboxfield',
                    boxLabelAlign: 'after',
                    fieldLabel: '',
                    margin: '0 0 25 200',
                    boxLabel: 'Show date for ' + half_accepted_ratio_name
                });
        }
        settings.push({
            name: 'hideTaskMovementColumn',
            xtype: 'rallycheckboxfield',
            boxLabelAlign: 'after',
            fieldLabel: '',
            margin: '0 0 25 200',
            boxLabel: 'Hide ' + task_churn_name
        });
        settings.push({
            name: 'showVelocityVariation',
            xtype: 'rallycheckboxfield',
            boxLabelAlign: 'after',
            fieldLabel: '',
            margin: '0 0 25 200',
            boxLabel: 'Show ' + velocity_variance_name
        });
        settings.push({
            name: 'allowGroupByLeafTeam',
            xtype: 'rallycheckboxfield',
            boxLabelAlign: 'after',
            fieldLabel: '',
            margin: '0 0 25 200',
            boxLabel: 'Allow Group by Leaf Team'
        });
        return settings;
    },
    //showSettings:  Override
    showSettings: function(options) {
        this._appSettings = Ext.create('Rally.app.AppSettings', Ext.apply({
            fields: this.getSettingsFields(),
            settings: this.getSettings(),
            defaultSettings: this.getDefaultSettings(),
            context: this.getContext(),
            settingsScope: this.settingsScope,
            autoScroll: true
        }, options));

        this._appSettings.on('cancel', this._hideSettings, this);
        this._appSettings.on('save', this._onSettingsSaved, this);
        if (this.isExternal()){
            if (this.down('#settings_box').getComponent(this._appSettings.id)==undefined){
                this.down('#settings_box').add(this._appSettings);
            }
        } else {
            this.hide();
            this.up().add(this._appSettings);
        }
        return this._appSettings;
    },

    _onSettingsSaved: function(settings){
        Ext.apply(this.settings, settings);
        this._hideSettings();
        this.healthConfig.updateSettings(settings);
        this.onSettingsUpdate(settings);
    }
});
