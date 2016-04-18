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

    constructor: function(config){
        this.artifactRecords = config.artifactRecords;
        this.doneStates = config.doneStates || ["Accepted"];
        this.iterationRecords = config.iterationRecords;
        this.cfdRecords = config.cfdRecords;
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
        },
    }
});
