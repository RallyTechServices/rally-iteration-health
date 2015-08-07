Ext.define('Rally.technicalservices.ModelBuilder',{
    singleton: true,

    build: function(modelType, newModelName) {
        var deferred = Ext.create('Deft.Deferred');

        Rally.data.ModelFactory.getModel({
            type: modelType,
            success: function(model) {

                var default_fields = [{
                    name: '__ratioEstimated',
                    defaultValue: '--'
                },{
                    name: '__days',
                    convert: function(value, record){
                        return Rally.technicalservices.util.Health.daysBetween(record.get('EndDate'),record.get('StartDate'),true) + 1;
                    }
                },{
                    name: '__ratioInProgress',
                    defaultValue: 0
                },{
                    name: '__halfAcceptedRatio',
                    defaultValue: 1
                }, {
                    name: '__halfAcceptedDate',
                    defaultValue: null
                },{
                    name: '__endCompletionRatio',
                    defaultValue: -1
                },{
                    name: '__endAcceptanceRatio',
                    defaultValue: 2
                },{
                    name: '__endIncompletionRatio',
                    defaultValue:  -1
                },{
                    name: '__scopeChurn_PlanEstimate',
                    defaultValue: -2
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
                    calculate: function(usePoints, skipZeroForEstimation) {

                        var iteration_oid = this.get('ObjectID');

                        if (this.get('__cfdRecords')){
                             this._processCFD(this.get('__cfdRecords'), usePoints);
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
                                    this.logger.log('Iteration CFD callback', success, operation, records.length);
                                    if (success){
                                        this.set('__cfdRecords',records);
                                        this._processCFD(records, usePoints);
                                    } else {
                                        this.logger.log('Error loading CFD records for Iteration',operation);
                                        this._setError();
                                    }
                                }
                            });

                            var iteration_name = this.get('Name');
                            var artifact_store = Ext.create('Rally.data.wsapi.artifact.Store', {
                                models: ['Defect', 'UserStory'],
                                fetch: ['ObjectID','PlanEstimate','ScheduleState'],
                                filters: [{
                                    property: 'Iteration.Name',
                                    value: iteration_name
                                }]
                            });
                            artifact_store.load({
                                scope: this,
                                callback: function(records, operation, success){
                                    this.logger.log('Iteration artifacts callback: ', success, operation, records.length);
                                    if (success){
                                        this._setArtifacts(records);
                                    } else {
                                        this.set('__estimationRatio', 'Error');
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
                    _processCFD: function(records, usePoints){

                        var daily_totals = {},
                            daily_task_estimate_totals = {};

                        Ext.Array.each(records, function(cf) {
                            var card_date = cf.get('CreationDate');

                            if (this._isValidDate(card_date)){
                                var card_total = cf.get('CardEstimateTotal') || 0,
                                    card_state = cf.get('CardState'),
                                    card_task_estimate = cf.get('TaskEstimateTotal') || 0;

                                if (!usePoints){
                                    card_total = cf.get('CardCount') || 0;
                                }

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

                        var done_states = ["Accepted"],
                            completed_state = "Completed",
                            days = this.get('__days');

                        this.set('__ratioInProgress',Rally.technicalservices.util.Health.getAverageInState(daily_totals,  "In-Progress"));

                        var half_accepted_ratio = Rally.technicalservices.util.Health.getHalfAcceptanceRatio(daily_totals, done_states, days);
                        this.set('__halfAcceptedRatio',half_accepted_ratio.Ratio);
                        this.set('__halfAcceptedDate',half_accepted_ratio.ratioDate);

                        this.set('__endAcceptanceRatio', Rally.technicalservices.util.Health.getAcceptanceRatio(daily_totals, done_states))

                        var incompletion_stats = Rally.technicalservices.util.Health.getIncompletionRatio(daily_totals,done_states, completed_state);
                        this.set('__endCompletionRatio', incompletion_stats.CompletionRatio);
                        this.set('__endIncompletionRatio', incompletion_stats.IncompletionRatio);

                        this.set('__scopeChurn',Rally.technicalservices.util.Health.getChurn(daily_totals));
                        this.set('__taskChurn',Rally.technicalservices.util.Health.getTaskChurn(daily_task_estimate_totals));


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
                    _setArtifacts: function(records, skipZero){
                       var count_of_estimated_artifacts = 0;

                        Ext.Array.each(records,function(artifact){
                            if (!skipZero || (skipZero && artifact.get('PlanEstimate') !== 0)){
                                var plan_estimate = artifact.get('PlanEstimate') || 0;

                                if ( plan_estimate > 0 ) {
                                    count_of_estimated_artifacts++;
                                }
                            }
                        });
                        this.logger.log('estimated ratio', count_of_estimated_artifacts, records.length);
                        if (records.length > 0){
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