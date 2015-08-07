Ext.define("rally-iteration-health", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    config: {
        defaultSettings: {
            showDateForHalfAcceptanceRatio:  false,
            hideTaskMovementColumn: true,
            useSavedRanges: false
        }
    },
    defaultNumIterations: 3,
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
            hideTaskMovementColumn: this.getSetting('hideTaskMovementColumn'),
            showDateForHalfAcceptanceRatio: this.getSetting('showDateForHalfAcceptanceRatio'),
            listeners: {
                scope: this,
                rangechanged: this._refreshView,
                ready: this._initApp
            }
        });


    },
    _refreshView: function(){
        this.logger.log('_refreshView');
        if (this.down('rallygrid')){
            this.down('rallygrid').getView().refresh();
        }
    },
    _initApp: function(child_project_count){

        var project_oid = this.getContext().getProject().ObjectID;
        Rally.technicalservices.WsapiToolbox.fetchWsapiCount('Project',[{property:'Parent.ObjectID',value: project_oid}]).then({
            scope: this,
            success: function(child_project_count){
                this.down('#criteria_box').removeAll();

                this.logger.log('_initApp', child_project_count);
                if (child_project_count == 0){
                    this._initForLeafProject();
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
    _initForLeafProject: function(){
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
                change: this._fetchIterations,
                staterestore: this._fetchIterations
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
    _fetchIterations: function(nbf){

        var today_iso = Rally.util.DateTime.toIsoString(new Date()),
            num_iterations = nbf ? nbf.getValue() : this.defaultNumIterations;

        this.logger.log('_fetchIterations', num_iterations);
        Rally.technicalservices.ModelBuilder.build('Iteration','IterationHealth').then({
            scope: this,
            success: function(model){
                this.iterationHealthStore = Ext.create('Rally.data.wsapi.Store',{
                    model: model,
                    limit: num_iterations,
                    pageSize: num_iterations,
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
                this.iterationHealthStore.load({
                    scope: this,
                    callback: function(records, operation, success){
                        this.logger.log("IterationHealthStore callback: ", success, operation, records);
                        if (success){
                            if (records.length > 0) {
                                this._updateDisplay();
                            } else {
                                this.down('#display_box').add({
                                    xtype:'container',
                                    html:'0 iterations found for the selected scope.'
                                });
                                Rally.ui.notify.Notifier.showWarning({message: 'No Iteration Records found for the current project scope.'});
                            }
                        } else {
                            this.iterationHealthStore = null;
                            Rally.ui.notify.Notifier.showError({message: 'Error loading Iteration Health Store: ' + operation.error.error.join(',')});
                        }
                    }
                });
            },
            failure: function(msg){
                this.logger.log(msg)
                Rally.ui.notify.Notifier.showError({message: msg});
            }
        });
    },
    _getColumnCfgs: function(){
        var config = this.healthConfig,
            column_cfgs = [];

        _.each(config.displaySettings, function(col, key){
            if (col.display){
                var cfg = {
                    dataIndex: key,
                    text: col.displayName || key,
                    scope: config
                };
                if (col.range){
                   cfg.listeners = {
                        scope: this,
                        headerclick: this._showColumnDescription
                    };
                }
                cfg.renderer = config.getRenderer(cfg.dataIndex);
                column_cfgs.push(cfg);
            }
        }, this);
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
            use_points = (metric_type == 'points'),
            skip_zero = this.healthConfig.skipZeroForEstimationRatio;
        this.healthConfig.usePoints = use_points;

        this.logger.log('_updateDisplay', this.iterationHealthStore, metric_type, use_points);
        if (!this.iterationHealthStore || metric_type == null){
            return;
        }


        //Update the store to load supporting records or recalculate with different metric.
        _.each(this.iterationHealthStore.getRecords(), function(r){
            r.calculate(use_points, skip_zero);
        });

        var column_cfgs = this._getColumnCfgs();

        this._displayGrid(this.iterationHealthStore, column_cfgs);
    },
    _displayGrid: function(store, column_cfgs){
        this.down('#display_box').removeAll();

        this.down('#display_box').add({
            xtype: 'rallygrid',
            store: store,
            sortableColumns: false,
            showPagingToolbar: false,
            enableBulkEdit: false,
            showRowActionsColumn: false,
            enableEditing: false,
            columnCfgs: column_cfgs
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
            half_accepted_ratio_name = this.healthConfig.displaySettings.__halfAcceptedRatio.displayName,
            task_churn_name = this.healthConfig.displaySettings.__taskChurn.displayName;

        if (this.healthConfig.displaySettings.__halfAcceptedRatio.display){
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
        this.onSettingsUpdate(settings);
    }
});
