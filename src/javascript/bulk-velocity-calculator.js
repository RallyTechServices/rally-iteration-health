Ext.define('Rally.technicalservices.IterationHealthBulkCalculator', {

    /**
     * configuration data sent into
     **/
    artifactRecords: undefined,
    doneStates: undefined,
    iterationRecords: undefined,
    cfdRecords: undefined,

    artifactsByIterationHash: undefined,
    cfdByIterationHash: undefined,
    sayDoByIterationOID: {},
    
    // for getting cycle time other than from in progress to accepted
    lookbackStateChanges: [],
    showIterationCycleTime: false,

    constructor: function(config){
        this.artifactRecords = config.artifactRecords;
        this.doneStates = config.doneStates || ["Accepted"];
        this.iterationRecords = config.iterationRecords;
        this.cfdRecords = config.cfdRecords;
        this.lookbackStateChanges = config.lookbackStateChanges || [];
        this.showIterationCycleTime = config.showIterationCycleTime;
        
        this._setStateChangesInArtifacts(this.lookbackStateChanges);
        this._setCycleTimes(this.artifactRecords, this.showIterationCycleTime);

    },
    
    _setCycleTimes: function(records, showIterationCycleTime) {
        if ( !showIterationCycleTime ) { return; }
        
        Ext.Array.each(records,function(artifact){ 
            var start_date = artifact.get('InProgressDate'),
                end_date = artifact.get('AcceptedDate');
            if ( showIterationCycleTime == "inprogress-to-completed") {
                start_date = artifact.get("__In-Progress_first");
                end_date   = artifact.get("__Completed_last");
                if ( Ext.isString(start_date) ) {
                    start_date = Rally.util.DateTime.fromIsoString(start_date);
                }
                if ( Ext.isString(end_date) ) {
                    end_date = Rally.util.DateTime.fromIsoString(end_date);
                }
            }
            
            var iteration = Ext.clone( artifact.get('Iteration') );
            var delta = -2;
            
            if ( !Ext.isEmpty(start_date) && !Ext.isEmpty(end_date) ) {
                delta = Rally.technicalservices.util.Health.daysBetween(end_date, start_date, true);
            }

            iteration.__cycleTime = delta;

            artifact.set('Iteration', iteration);
        });
    },
    
    _setStateChangesInArtifacts: function(lookbackStateChanges) {
        if ( lookbackStateChanges.length == [] ) {
            return;
        }
        
        var artifacts_by_oid = {};
        Ext.Array.each(this.artifactRecords, function(record){
            var oid = record.get('ObjectID');
            artifacts_by_oid[oid] = record;
        });
        
        Ext.Array.each(lookbackStateChanges, function(snapshot){
            var oid = snapshot.get('ObjectID');
            if ( Ext.isEmpty(artifacts_by_oid[oid])) { return; }
            var artifact = artifacts_by_oid[oid];
            var old_state = snapshot.get('_PreviousValues.ScheduleState');
            var new_state = snapshot.get('ScheduleState');

            this._setTransition(artifact, new_state, old_state, snapshot.get('_ValidFrom'));
            
        },this);
    },
    
    _setTransition: function(artifact, new_state, old_state, change_date) {
        var state_array = Ext.Array.push(["Defined","In-Progress","Completed"], this.doneStates);
        
        var in_index = Ext.Array.indexOf(state_array, new_state);
        if ( in_index == -1 ) { return; }
        var out_index = Ext.Array.indexOf(state_array, old_state);
        
        var states_of_interest = [ new_state ];
        
        // in situation where we came from the left and skipped a state
        // want to set interim states
        if ( out_index < in_index ) {
            states_of_interest = Ext.Array.slice(state_array, out_index+1, in_index+1);
        }
        
        //console.log('interesting states:', states_of_interest, new_state);
        
        Ext.Array.each(states_of_interest, function(state){
            var first_transition_name = "__" + state + "_first";
            var last_transition_name =  "__" + state + "_last";
            
            if ( Ext.isEmpty(artifact.get(first_transition_name)) ) {
                artifact.set(first_transition_name, change_date);
            }
//            
            artifact.set(last_transition_name, change_date);
        });
    },
    
    getVelocityByIterationHash: function(){
        if (!this.velocityByIterationHash){
            var iterationHash = this.getArtifactsByIterationHash(),
                doneStates = this.doneStates,
                velocityHash = {};

            _.each(iterationHash, function(records, iteration){
                var velocity = 0;
                _.each(records, function(r){
                    if (Ext.Array.contains(doneStates, r.ScheduleState)){
                        velocity += r.PlanEstimate || 0;
                    }
                });
                velocityHash[iteration] = velocity;
            });
            this.velocityByIterationHash = velocityHash;
        }

        return this.velocityByIterationHash;
    },
    getPreviousIterationVelocities: function(iterationRecord, numIterations){
        //Organize iteration by project and then sort in descending order from latest start date
        var project = iterationRecord.get('Project').ObjectID,
            projectIterations = _.pluck(this.getSortedIterationsByProjectHash()[project], 'ObjectID');

        var idx = _.indexOf(projectIterations, iterationRecord.get('ObjectID'));
        if ((idx + numIterations) < projectIterations.length){
            var velocityIterations = projectIterations.slice(idx + 1, idx + numIterations + 1);
            return _.map(velocityIterations, function(i) { return this.getVelocityByIterationHash()[i] || 0;}, this);
        }
        return [];
    },
    getSortedIterationsByProjectHash: function(){
        if (!this.sortedIterationsByProjectHash){
            this.sortedIterationsByProject = Rally.technicalservices.IterationHealthBulkCalculator.buildSortedIterationByProjectHash(this.iterationRecords);
        }
        return this.sortedIterationsByProject;

    },
    getCFDByIteration: function(iterationOid){
        return this.getCFDByIterationHash()[iterationOid] || null;
    },
    
    getCFDByIterationHash: function(){
        if (!this.cfdByIterationHash){
            this.cfdByIterationHash = Rally.technicalservices.IterationHealthBulkCalculator._getHashByOid(this.cfdRecords, 'IterationObjectID');
        }
        return this.cfdByIterationHash;
    },
    getArtifactsByIterationHash: function(){
        if (!this.artifactsByIterationHash){
            this.artifactsByIterationHash = Rally.technicalservices.IterationHealthBulkCalculator._getHashByOid(this.artifactRecords, "Iteration","ObjectID");
        }
        return this.artifactsByIterationHash;
    },
    getArtifactsByIteration: function(iterationOid){
        return this.getArtifactsByIterationHash()[iterationOid] || null;
    },

    statics: {
        buildSortedIterationByProjectHash: function(iterationRecords){
            var iterationsByProjectHash = Rally.technicalservices.IterationHealthBulkCalculator._getHashByOid(iterationRecords, "Project","ObjectID"),
                sortedIterationsByProjectHash = {};

            _.each(iterationsByProjectHash, function(iterations, project){
                sortedIterationsByProjectHash[project] = _.sortBy(iterations, function(i){ return -Date.parse(i.StartDate); });
            });
            return sortedIterationsByProjectHash;
        },
        _getHashByOid: function(records, oidFieldName, oidAttributeName){
            var hash = {};
            for (var i=0; i<records.length; i++){
                var oid = records[i].get(oidFieldName) || records[i][oidFieldName];
                if (oidAttributeName){
                    oid = oid[oidAttributeName];
                }
                if (!hash[oid]){
                    hash[oid] = [];
                }
                hash[oid].push(records[i].getData());
            }
            return hash;
        }
    }
});
