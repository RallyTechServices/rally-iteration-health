describe("Fast BulkCalculator tests",function() {
    describe("When working with artifact records for an iteration", function () {

    var createArtifact = function(planEstimate, objectId, scheduleState, iteration){
        var a = Ext.create('mockStory');
        a.set('PlanEstimate', planEstimate);
        a.set('ObjectID', objectId);
        a.set('ScheduleState', scheduleState);
        a.set('Iteration', { ObjectID: iteration });
        return a;
    };

        var createIteration = function(startDate, endDate, name, projectID, objectID){
            var i = Ext.create('mockIteration');
            i.set('StartDate', startDate);
            i.set('EndDate', endDate);
            i.set('ObjectID', objectID);
            i.set('Project', { ObjectID: projectID });
            i.set('Name', name);
            return i;
        };

    var artifactObjectID = 1,
        artifactRecords = [
        createArtifact(5,artifactObjectID++,"Defined",101),
        createArtifact(3,artifactObjectID++,"Accepted",101),
        createArtifact(3,artifactObjectID++,"Accepted",101),
        createArtifact(0,artifactObjectID++,"Accepted",101),
        createArtifact("",artifactObjectID++,"Accepted",101),
        createArtifact(4,artifactObjectID++,"Completed",101),
        createArtifact(2,artifactObjectID++,"In-Progress",101),
        createArtifact(0,artifactObjectID++,"Completed",101),
        //Velocity= 6

        createArtifact(2,artifactObjectID++,"Defined",102),
        createArtifact(1,artifactObjectID++,"Accepted",102),
        createArtifact(3,artifactObjectID++,"Accepted",102),
        createArtifact(8,artifactObjectID++,"Released",102),
        createArtifact(1,artifactObjectID++,"Released",102),
        createArtifact("",artifactObjectID++,"Accepted",102),
        createArtifact(1,artifactObjectID++,"Completed",102),
        createArtifact(2,artifactObjectID++,"In-Progress",102),
        createArtifact(0,artifactObjectID++,"Completed",102)
        //Velocity= 5
    ];


        var iterationObjectID = 101,
            iterationRecords = [
                createIteration(new Date(2015, 1,30), new Date(2015, 2, 12), 'third 1', 1000,iterationObjectID++),
                createIteration(new Date(2015, 1,15), new Date(2015, 1, 29), 'second 1', 1000,iterationObjectID++),
                createIteration(new Date(2015, 1, 1), new Date(2015, 1, 14), 'first 1', 1000, iterationObjectID++),
                createIteration(new Date(2015, 2,13), new Date(2015, 2, 28), 'fourth 1', 1000,iterationObjectID++),
                createIteration(new Date(2015, 1, 1), new Date(2015, 1, 14),'first 2', 2000, iterationObjectID++),
                createIteration(new Date(2015, 2,13), new Date(2015, 2, 28), 'third 2', 2000,iterationObjectID++),
                createIteration(new Date(2015, 1,15), new Date(2015, 1, 29), 'second 2', 2000,iterationObjectID++),
                createIteration(new Date(2015, 1,30), new Date(2015, 2, 12), 'first 3', 3000,iterationObjectID++)
            ];



        it('should calculate velocities', function () {

            var calculator = Ext.create('Rally.technicalservices.IterationHealthBulkCalculator',{
                doneStates: ["Accepted","Released"],
                iterationRecords: iterationRecords,
                artifactRecords: artifactRecords
            });

            var hash = calculator.getVelocityByIterationHash();

            expect(hash["101"]).toEqual(6);
            expect(hash["102"]).toEqual(13);
        });
        it ('should sort iterations by project accurately', function (){

            var calculator = Ext.create('Rally.technicalservices.IterationHealthBulkCalculator',{
                doneStates: ["Accepted","Released"],
                iterationRecords: iterationRecords,
                artifactRecords: artifactRecords
            });

            var hash = calculator.getSortedIterationsByProjectHash();

            expect(hash["1000"][3].Name).toEqual('first 1');
            expect(hash["1000"][2].Name).toEqual('second 1');
            expect(hash["1000"][1].Name).toEqual('third 1');
            expect(hash["1000"][0].Name).toEqual('fourth 1');

            expect(hash["2000"][2].Name).toEqual('first 2');
            expect(hash["2000"][1].Name).toEqual('second 2');
            expect(hash["2000"][0].Name).toEqual('third 2');

            expect(hash["3000"][0].Name).toEqual('first 3');
        });

        it ('should calculate previous iteration velocities properly', function(){
            var calculator = Ext.create('Rally.technicalservices.IterationHealthBulkCalculator',{
                doneStates: ["Accepted","Released"],
                iterationRecords: iterationRecords,
                artifactRecords: artifactRecords
            });

            expect(calculator.getPreviousIterationVelocities(iterationRecords[3],3)).toEqual([6,13,0]);
        });
    });
});

