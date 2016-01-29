Ext.define('Rally.technicalservices.util.Health',{
    singleton: true,
    /**
     *
     * @param {} an_array  an array of numbers
     *
     * returns the standard deviation
     */
    getStandardDeviation: function(an_array){
        var mean = Ext.Array.mean(an_array);
        var numerator = 0;

        Ext.Array.each(an_array,function(item){
            numerator += ( mean - item ) * ( mean - item ) ;
        });

        var deviation = Math.sqrt(numerator / an_array.length);

        return deviation;
    },
    /**
     * Go through the array of day totals.  If there are
     * more going up than down, return 1, if more going down than
     * going up, return -1
     */
    getChurnDirection: function(totals) {
        var variance = 0;
        var last_value = 0;
        Ext.Array.each(totals, function(totals,index){
            if ( index > 0 ) {
                variance = variance + ( totals - last_value );
            }
            last_value = totals;
        });
        if (variance && variance !== 0){
            return variance / Math.abs(variance);
        }
        return 1;
    },
    getChurn: function(health_hash){
        var totals = [],
            days = _.keys(health_hash);

        var dev_ratio = 0;
        _.each(days, function(day){
            totals.push(Rally.technicalservices.util.Health.getDayTotal(health_hash, day));
        });

        var stdev = Rally.technicalservices.util.Health.getStandardDeviation(totals);
        if (stdev >= 0 && Ext.Array.mean(totals) != 0){
            dev_ratio = Ext.util.Format.number(stdev/Ext.Array.mean(totals),"0.00");
        }
        direction = Rally.technicalservices.util.Health.getChurnDirection(totals);

        var churn = dev_ratio * direction;
        if (!isNaN(churn)){
            return dev_ratio * direction;
        }
        return null;
    },
    getDayTotal: function(hash, key){
        if (hash[key]){
            return Ext.Array.sum(_.values(hash[key]));
        }
        return 0;
    },
    getTaskChurn: function(health_hash){

        var previous_value = null;
        var last_day_value = null,
            days = _.keys(health_hash);

         _.each(days, function(day){
            if ( last_day_value != null ) {
                previous_value = last_day_value;
            }
            last_day_value = Rally.technicalservices.util.Health.getDayTotal(health_hash, day);
        });

        if (last_day_value == null || previous_value == null || (last_day_value == 0 && previous_value == 0)){
            return null;
        }
        return Ext.util.Format.number(( last_day_value - previous_value)/previous_value,"0.00");
    },
    getAverageInState:function(health_hash, state){
        var totals = [],
            days = _.keys(health_hash);

        _.each(days, function(day){
            var day_total = Ext.Array.sum(_.values(health_hash[day])),
                day_in_state = health_hash[day][state] || 0;
            if (day_total > 0){
                totals.push( day_in_state/day_total );
            } else {
                totals.push(0);
            }
        });

        return Ext.util.Format.number(Ext.Array.mean(totals),"0.00");
    },
    getDayTotalsArray: function(health_hash){
        var day_totals = [];
        _.each(health_hash, function(state_hash, day){
            day_totals.push(Rally.technicalservices.util.Health.getDayTotal(health_hash, day));
        });
        return day_totals;
    },
    getDoneStatesHash: function(health_hash, done_states){
        var done_hash = {};
        _.each(health_hash, function(state_hash, date){
            done_hash[date] = 0;
            _.each(done_states, function(state){
                 done_hash[date] += state_hash[state] || 0;
            });
        });
        return done_hash;
    },
    getAllHash: function(health_hash){
        var hash = {};
        _.each(health_hash, function(state_hash, day){
            hash[day] = Rally.technicalservices.util.Health.getDayTotal(health_hash, day);
        });
        return hash;
    },
    getVelocity:function(health_hash, done_states){
        var done_hash = Rally.technicalservices.util.Health.getDoneStatesHash(health_hash, done_states);
        var days = _.sortBy(_.keys(done_hash), function(date){return Date.parse(date)});
        return done_hash[days[days.length-1]] || 0;
    },
    getHalfAcceptanceRatio:function(health_hash, done_states, num_days_in_iteration){

        var done_hash = Rally.technicalservices.util.Health.getDoneStatesHash(health_hash, done_states),
            total_hash = Rally.technicalservices.util.Health.getAllHash(health_hash);

        var day_index = -1,
            day_counter = 0,
            day_accomplished = null;

        var days = _.sortBy(_.keys(total_hash), function(date){return Date.parse(date)});

        _.each(days, function(day){
            day_counter++;

            var total = total_hash[day] || 0;
            var day_accepted = done_hash[day] || 0;

            if ( day_accepted/total >= 0.5 && day_index === -1 ) {
                day_index = day_counter;
                day_accomplished = day;
            } else if ( day_accepted/total < 0.5 && day_index > -1 ) {
                // if we slipped back to under 50%
                day_index = -1;
                day_accomplished = null;
            }
        });
        var ratio = 2;
         if ( day_index > -1 ) {
            if (num_days_in_iteration > -1 ) {
                day_counter = num_days_in_iteration;
            }

            ratio = Ext.util.Format.number(day_index/day_counter,"0.00");
        }

        return {Ratio: ratio, ratioDate: day_accomplished};
    },
    /**
     * Given a hash of hashes structured as:
     *
     * The outer hash key is state (plus "All")
     * The inner hash key is date (in JS date format)
     * The inner value is the sum of estimates for that day
     */
    getIncompletionRatio:function(health_hash, done_states, completed_state){

        var done_hash = Rally.technicalservices.util.Health.getDoneStatesHash(health_hash, done_states),
            dates = _.keys(health_hash),
            last_date = dates.pop(),
            last_total = Rally.technicalservices.util.Health.getDayTotal(health_hash,last_date),
            last_accepted = done_hash[last_date],
            last_completed =  health_hash[last_date][completed_state] || 0;

            var ratio = 2;
            if ( last_total > 0 ) {
                ratio = 1 - ( (last_completed+last_accepted)/last_total );
            }
            ratio = Ext.util.Format.number(ratio,"0.00");

            var inverse_ratio = 2;
            if ( last_total > 0 ) {
                inverse_ratio = Ext.util.Format.number(1-ratio,"0.00");
            }
        return {CompletionRatio: inverse_ratio, IncompletionRatio: ratio };

    },
    getVelocityVariance: function(velocity, previousVelocities, minNumberPreviousVelocities){
        console.log('xxxgetVelocityVariance',velocity, previousVelocities,minNumberPreviousVelocities)
        if (previousVelocities && previousVelocities.length >= minNumberPreviousVelocities){
            var average_velocity = Ext.Array.mean(previousVelocities),
                velocity_variance = 0;

            console.log('xxxgetVelocityVariance average', average_velocity);
            if (average_velocity > 0){
                velocity_variance = Number(velocity/average_velocity - 1);
                return velocity_variance;
            }
        }
        return null;
    },
    /**
     * Given a hash of hashes structured as:
     *
     * The outer hash key is state (plus "All")
     * The inner hash key is date (in JS date format)
     * The inner value is the sum of estimates for that day
     */
    getAcceptanceRatio:function(health_hash, done_states){
        var ratio = 2,
            done_hash = Rally.technicalservices.util.Health.getDoneStatesHash(health_hash, done_states);

        var card_dates = _.keys(health_hash),
            last_date = card_dates.pop(),
            last_total = Rally.technicalservices.util.Health.getDayTotal(health_hash, last_date),
            last_accepted = done_hash[last_date] || 0;

        if ( last_total > 0 ) {
            ratio = last_accepted/last_total;
        }
        ratio = Ext.util.Format.number(ratio,"0.00");
        return ratio;
    },
    daysBetween: function(begin_date_js,end_date_js,skip_weekends){
        var dDate1 = Ext.clone(begin_date_js).setHours(0,0,0,0);
        var dDate2 = Ext.clone(end_date_js).setHours(0,0,0,0);

        if ( dDate1 == dDate2 ) { return 0; }
        if (typeof dDate1 === "number") { dDate1 = new Date(dDate1); }
        if (typeof dDate2 === "number") { dDate2 = new Date(dDate2); }

        if ( !skip_weekends ) {
            return Math.abs( Rally.util.DateTime.getDifference(dDate1,dDate2,'day') );
        } else {
            // BRUTE FORCE
            if (dDate2 < dDate1)
            {
                var x = dDate2;
                dDate2 = dDate1;
                dDate1 = x;
            }
            var counter = 0;
            var date_chit = dDate1;
            while ( date_chit < dDate2 ) {

                var day_of_week = date_chit.getDay();
                if ( day_of_week != 0 && day_of_week != 6 ) {
                    counter++;
                }
                var next_day = Rally.util.DateTime.add(date_chit,"day",1);
                date_chit = next_day;
            }
            return counter;
        }
    }
});
