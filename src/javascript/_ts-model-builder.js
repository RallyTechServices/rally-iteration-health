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
                        if (record.get('EndDate') && record.get('StartDate')){
                            return Rally.technicalservices.util.Health.daysBetween(record.get('EndDate'),record.get('StartDate'),true) + 1;
                        } else {
                            return '--';
                        }

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
                },{
                    name: '__velocity',
                    defaultValue: -2
                },{
                    name: '__velocityVariance',
                    defaultValue: null
                },{
                    name: '__currentVelocity',
                    defaultValue: -2
                },{
                    name: '__cycleTime',
                    defaultValue: -2
                }];

                var new_model = Ext.define(newModelName, {
                    extend: model,
                    logger: new Rally.technicalservices.Logger(),
                    fields: default_fields,
                    calculate: function(usePoints, skipZeroForEstimation, previousIterationCount, doneStates) {
                        this.logger.log('calculate', this.get('Name'));

                        this.resetDefaults();

                        var iteration_oid = this.get('ObjectID');

                        if (this.get('__cfdRecords')) {
                            this._processCFD(this.get('__cfdRecords'), usePoints, doneStates);
                        }

                        if (this.get('__iterationArtifacts')){
                            this._setArtifacts(this.get('__iterationArtifacts'), doneStates, iteration_oid);
                            if (this.get('__previousIterationVelocities') && this.get('EndDate') < new Date()){
                                var variance = Rally.technicalservices.util.Health.getVelocityVariance(this.get('__currentVelocity'),this.get('__previousIterationVelocities'),previousIterationCount);
                                this.set('__velocityVariance', variance);
                            }
                            
                            
                            
                        }


                    },


                    resetDefaults: function(){
                        this.set('__ratioInProgress',-1);
                        this.set('__halfAcceptedRatio', -1);
                        this.set('__halfAcceptedDate','');
                        this.set('__endCompletionRatio', -1);
                        this.set('__endAcceptanceRatio'-1);
                        this.set('__endIncompletionRatio',-1);
                        this.set('__taskChurn', -2);
                        this.set('__scopeChurn', -2);
                        this.set('__velocityVariance',null);
                        this.set('__cycleTime',-2);

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

                        this.set('__velocityVariance',errorString);

                    },
                    _processCFD: function(records, usePoints, doneStates){

                        var daily_totals = {},
                            daily_task_estimate_totals = {},
                            counter = 0;
                        this.logger.log('_processCFD', records.length, usePoints, doneStates,records);
                        Ext.Array.each(records, function(cf) {
                            var card_date = cf.CreationDate; //cf.get('CreationDate');

                            if (this._isValidDate(card_date)){
                                var card_total = cf.CardEstimateTotal || 0,
                                    card_state = cf.CardState,
                                    card_task_estimate = cf.TaskEstimateTotal || 0;

                                if (usePoints === false){
                                    card_total = cf.CardCount || 0;
                                }
                                //this.logger.log('cardcount',this.get('Name'),card_state,card_date, cf.CardCount, cf.CardEstimateTotal,card_task_estimate);
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

                        //this.logger.log('totals',this.get('Name'),daily_totals, daily_task_estimate_totals, doneStates);

                        var avg_daily_in_progress = Rally.technicalservices.util.Health.getAverageInState(daily_totals, inprogress_state);
                        //this.logger.log('avg_daily_inprogress',this.get('Name'), avg_daily_in_progress)
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
                        if (churn !== null){
                            this.set('__scopeChurn',Rally.technicalservices.util.Health.getChurn(daily_totals));
                        }

                        var task_churn = Rally.technicalservices.util.Health.getTaskChurn(daily_task_estimate_totals);
                        //this.logger.log('__taskChurn', 'getTaskChurn', this.get('Name'), task_churn);
                        if (task_churn !== null){
                            this.set('__taskChurn',task_churn);
                        }

                        var velocity = Rally.technicalservices.util.Health.getVelocity(daily_totals, doneStates);
                        this.set('__velocity', velocity);

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
                    _setArtifacts: function(records, doneStates, thisIterationObjectID){
                       var count_of_estimated_artifacts = 0;
                        this.logger.log('_setArtifacts', records);
                        var velocity = {},
                            this_velocity = 0,
                            this_count = 0,
                            cycle_times = [];

                        Ext.Array.each(records,function(artifact){
                            var artifact_iteration = artifact.Iteration.ObjectID,
                                plan_estimate = artifact.PlanEstimate,
                                start_date = artifact.InProgressDate,
                                end_date = artifact.AcceptedDate;

                                this_count++;
                                if (!Ext.isEmpty(plan_estimate) && plan_estimate >= 0) {
                                    count_of_estimated_artifacts++;
                                    if (Ext.Array.contains(doneStates, artifact.ScheduleState)){
                                        this_velocity += plan_estimate;
                                    }
                                } else {
                                    this.logger.log('artifact not included plan_estimate -->', plan_estimate, artifact.FormattedID);
                                }
                                
                                if ( !Ext.isEmpty(start_date) && !Ext.isEmpty(end_date) ) {
                                    cycle_times.push(Rally.util.DateTime.getDifference(end_date,start_date, 'hour') );
                                }
                        }, this);

                        this.set('__currentVelocity', this_velocity);  // this uses velocity that is as of now

                        this.logger.log('cycle time array:', cycle_times);
                        if ( cycle_times.length > 0 ) {
                            this.set('__cycleTime', Ext.Array.mean(cycle_times));
                        }
                        this.logger.log('estimated ratio estimated: ', count_of_estimated_artifacts, ' total: ', this_count);
                        if (this_count > 0){
                            this.set('__ratioEstimated',count_of_estimated_artifacts/this_count);
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