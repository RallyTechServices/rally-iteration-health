Ext.define('Rally.technicalservices.ModelBuilder',{
    singleton: true,

    build: function(modelType, newModelName) {
        var deferred = Ext.create('Deft.Deferred');

        Rally.data.ModelFactory.getModel({
            type: modelType,
            success: function(model) {

                var default_fields = [{
                    name: '__ratioEstimated',
                    defaultValue: -1
                },{
                    name: '__days',
                    convert: function(value, record){
                        return Rally.technicalservices.util.Health.daysBetween(record.get('EndDate'),record.get('StartDate'),true) + 1;
                    }
                },{
                    name: '__ratioInProgress',
                    defaultValue: -1
                },{
                    name: '__halfAcceptedRatio',
                    defaultValue: -1
                }, {
                    name: '__halfAcceptedDate',
                    defaultValue: ''
                },{
                    name: '__endCompletionRatio',
                    defaultValue: -1
                },{
                    name: '__endAcceptanceRatio',
                    defaultValue: -1 //2
                },{
                    name: '__endIncompletionRatio',
                    defaultValue:  -1
                },{
                    name: '__taskChurn',
                    defaultValue: -2
                },{
                    name: '__scopeChurn',
                    defaultValue: -2
                }];

                var new_model = Ext.define(newModelName, {
                    extend: model,
                    logger: new Rally.technicalservices.Logger(),
                    fields: default_fields,
                    calculate: function(usePoints, skipZeroForEstimation, doneStates) {
                        this.logger.log('calculate', this.get('Name'));
                        var iteration_oid = this.get('ObjectID');

                        if (this.get('__cfdRecords')){
                             this._processCFD(this.get('__cfdRecords'), usePoints, doneStates);
                        } else {
                            var store = Ext.create('Rally.data.wsapi.Store', {
                                model: 'IterationCumulativeFlowData',
                                filters: [{property: 'IterationObjectID', value: iteration_oid}],
                                fetch: ['CardCount', 'CardEstimateTotal', 'CreationDate', 'IterationObjectID', 'TaskEstimateTotal', 'CardToDoTotal', 'CardState'],
                                sorters: [{
                                    property: 'CreationDate',
                                    direction: 'ASC'
                                }],
                                limit: 'Infinity'
                            });

                            store.load({
                                scope: this,
                                callback: function(records, operation, success){
                                    this.logger.log('Iteration CFD callback', success, this.get('Name'), operation, records, records.length);
                                    if (success){
                                        if (records && records.length > 0){
                                            this.set('__cfdRecords',records);
                                            this._processCFD(records, usePoints, doneStates);
                                        }
                                    } else {
                                        this.logger.log('Error loading CFD records for Iteration',operation);
                                        this._setError();
                                    }
                                }
                            });

                            var iteration_name = this.get('Name'),
                                filters = [{
                                    property: 'Iteration.Name',
                                    value: iteration_name
                                }];
                            if (skipZeroForEstimation){
                                filters.push({
                                    property: 'PlanEstimate',
                                    operator: '!=',
                                    value: 0
                                });
                            }

                            var artifact_store = Ext.create('Rally.data.wsapi.artifact.Store', {
                                models: ['Defect', 'UserStory'],
                                fetch: ['ObjectID','PlanEstimate','ScheduleState','FormattedID'],
                                filters: filters
                            });
                            artifact_store.load({
                                scope: this,
                                callback: function(records, operation, success){
                                    this.logger.log('Iteration artifacts callback: ', success, operation, records.length);
                                    if (success){
                                        this._setArtifacts(records);
                                    } else {
                                        this.set('__ratioEstimated', 'Error');
                                    }
                                }
                            });
                        }
                    },
                    _setError: function(){

                        var errorString = 'Error';

                        this.set('__ratioInProgress', errorString);
                        this.set('__halfAcceptedRatio',errorString);
                        this.set('__halfAcceptedDate',errorString);

                        this.set('__endAcceptanceRatio', errorString);
                        this.set('__endCompletionRatio', errorString);
                        this.set('__endIncompletionRatio', errorString);

                        this.set('__scopeChurn',errorString);
                        this.set('__taskChurn',errorString);

                    },
                    _processCFD: function(records, usePoints, doneStates){

                        var daily_totals = {},
                            daily_task_estimate_totals = {},
                            counter = 0;
                        this.logger.log('_processCFD', records.length, usePoints, doneStates,records);
                        Ext.Array.each(records, function(cf) {
                            var card_date = cf.get('CreationDate');

                            if (this._isValidDate(card_date)){
                                var card_total = cf.get('CardEstimateTotal') || 0,
                                    card_state = cf.get('CardState'),
                                    card_task_estimate = cf.get('TaskEstimateTotal') || 0;

                                if (usePoints === false){
                                    card_total = cf.get('CardCount') || 0;
                                }
                                this.logger.log('cardcount',card_state,card_date, cf.get('CardCount'), cf.get('CardEstimateTotal'));
                                if (!daily_totals[card_date]){
                                    daily_totals[card_date] = {};
                                }
                                if (!daily_task_estimate_totals[card_date]){
                                    daily_task_estimate_totals[card_date] = {};
                                }

                                if (!daily_totals[card_date][card_state]){
                                    daily_totals[card_date][card_state] = 0;
                                }
                                if (!daily_task_estimate_totals[card_date][card_state]){
                                    daily_task_estimate_totals[card_date][card_state] = 0;
                                }
                                daily_totals[card_date][card_state] += card_total;
                                daily_task_estimate_totals[card_date][card_state] += card_task_estimate;
                            }
                        }, this);

                        var completed_state = "Completed",
                            inprogress_state = "In-Progress",
                            days = this.get('__days');

                        this.logger.log('totals',this.get('Name'),daily_totals, daily_task_estimate_totals, doneStates);

                        var avg_daily_in_progress = Rally.technicalservices.util.Health.getAverageInState(daily_totals, inprogress_state);
                        this.logger.log('avg_daily_inprogress',this.get('Name'), avg_daily_in_progress)
                        if (avg_daily_in_progress > 0){
                            this.set('__ratioInProgress',avg_daily_in_progress);
                        }

                        var half_accepted_ratio = Rally.technicalservices.util.Health.getHalfAcceptanceRatio(daily_totals, doneStates, days);
                        this.set('__halfAcceptedRatio',half_accepted_ratio.Ratio);
                        this.set('__halfAcceptedDate',half_accepted_ratio.ratioDate);

                        this.set('__endAcceptanceRatio', Rally.technicalservices.util.Health.getAcceptanceRatio(daily_totals, doneStates))

                        var incompletion_stats = Rally.technicalservices.util.Health.getIncompletionRatio(daily_totals,doneStates, completed_state);
                        this.set('__endCompletionRatio', incompletion_stats.CompletionRatio);
                        this.set('__endIncompletionRatio', incompletion_stats.IncompletionRatio);

                        var churn = Rally.technicalservices.util.Health.getChurn(daily_totals);
                        if (churn){
                            this.set('__scopeChurn',Rally.technicalservices.util.Health.getChurn(daily_totals));
                        }

                        var task_churn = Rally.technicalservices.util.Health.getTaskChurn(daily_task_estimate_totals);
                        this.logger.log('__taskChurn', 'getTaskChurn', this.get('Name'), task_churn);
                        if (!isNaN(task_churn)){
                            this.set('__taskChurn',task_churn);
                        }


                    },
                    /**
                     * _isValidDate determines whether or not to use this card in the calculations.  This
                     * checks for weekends and if the date is within the sprint
                     *
                     * @param card_date
                     * @returns {boolean}
                     * @private
                     */
                    _isValidDate: function(card_date) {
                        //NOTE: original app returns true of there is no start or end date in the iteration.
                        if (!card_date || ( card_date.getDay() > 0 && card_date.getDay() < 6 )){
                            if (this.get('EndDate') && this.get('StartDate')){
                                return (card_date <= this.get('EndDate') && card_date >= this.get('StartDate'));
                            }
                            return true;
                        }
                        return false;
                    },
                    _setArtifacts: function(records){
                       var count_of_estimated_artifacts = 0;
                        this.logger.log('_setArtifacts', records);

                        Ext.Array.each(records,function(artifact){
                           var plan_estimate = artifact.get('PlanEstimate');
                            if (!Ext.isEmpty(plan_estimate) && plan_estimate >= 0) {
                                count_of_estimated_artifacts++;
                            } else {
                                this.logger.log('artifact not included plan_estimate -->', plan_estimate, artifact.get('FormattedID'));
                            }
                        }, this);
                        this.logger.log('estimated ratio estimated: ', count_of_estimated_artifacts, ' total: ',  records.length);
                        if (records && records.length > 0){
                            this.set('__ratioEstimated',count_of_estimated_artifacts/records.length);
                        }
                    }
                });
                deferred.resolve(new_model);
            }
        });
        return deferred;
    },

    // sometimes, dates are provided as beginning of day, but we 
    // want to go to the end of the day
    shiftToEndOfDay: function(js_date) {
        return Rally.util.DateTime.add(Rally.util.DateTime.add(js_date,'day',1),'second',-1);
    },

    isAccepted: function(state) {
        return ( state == 'Accepted' );
    }
});