describe("Fast Project Model tests for ICFD health related to tasks",function(){
    var wednesday;
    var tuesday;
    var monday;
    var thursday;
    var friday;
    var saturday;
    var sunday;
    
    beforeEach(function () {
        friday = new Date(2013,8,20,0,0,0);
        saturday = new Date(2013,8,21,0,0,0);
        sunday = new Date(2013,8,22,0,0,0);
        monday = new Date(2013,8,23,0,0,0);
        tuesday = new Date(2013,8,24,0,0,0);
        wednesday = new Date(2013,8,25,0,0,0);
        thursday = new Date(2013,8,26,0,0,0);
    });
  
    describe("When adding ICFD data to calculate task churn", function(){
        it('should reset health measures',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Project X',
                ObjectID: 1236
            });
            
            var iteration = {
                Name: 'Sprint 1',
                ObjectID: 8675309,
                StartDate: wednesday,
                EndDate: shiftDayBeginningToEnd(thursday)
            };
            project.addIteration(iteration);
            
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, TaskEstimateTotal: 0, CreationDate: wednesday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, TaskEstimateTotal: 4, CreationDate: wednesday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, TaskEstimateTotal: 4, CreationDate: wednesday });

            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, TaskEstimateTotal: 0, CreationDate: thursday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, TaskEstimateTotal: 1, CreationDate: thursday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, TaskEstimateTotal: 1, CreationDate: thursday });
            
            
            project.setIterationCumulativeFlowData([
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2
            ]);
            
            project.resetHealth();
            expect(project.get('health_churn_task')).toEqual(-2);
        });
    });
    
    describe("When adding ICFD data to projects calculate churn",function(){
        it('should provide 0 when no changes in tasks',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Project X',
                ObjectID: 1236
            });
            
            var iteration = {
                Name: 'Sprint 1',
                ObjectID: 8675309,
                StartDate: tuesday,
                EndDate: shiftDayBeginningToEnd(wednesday)
            };
            project.addIteration(iteration);
            
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, TaskEstimateTotal: 0, CreationDate: tuesday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, TaskEstimateTotal: 4, CreationDate: tuesday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, TaskEstimateTotal: 4, CreationDate: tuesday });

            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, TaskEstimateTotal: 8, CreationDate: wednesday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, TaskEstimateTotal: 0, CreationDate: wednesday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, TaskEstimateTotal: 0, CreationDate: wednesday });
            
            
            project.setIterationCumulativeFlowData([
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2
            ]);
            
            expect(project.get('health_churn_task')).toEqual(0);
        });
        
        it('should provide a percentage when tasks change last day',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Project X',
                ObjectID: 1236
            });
            
            var iteration = {
                Name: 'Sprint 1',
                ObjectID: 8675309,
                StartDate: wednesday,
                EndDate: shiftDayBeginningToEnd(thursday)
            };
            project.addIteration(iteration);
            
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, TaskEstimateTotal: 0, CreationDate: wednesday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, TaskEstimateTotal: 4, CreationDate: wednesday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, TaskEstimateTotal: 4, CreationDate: wednesday });

            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, TaskEstimateTotal: 4, CreationDate: thursday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, TaskEstimateTotal: 0, CreationDate: thursday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, TaskEstimateTotal: 0, CreationDate: thursday });
            
            
            project.setIterationCumulativeFlowData([
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2
            ]);
            
            expect(project.get('health_churn_task')).toEqual(0.5);
        });        
        
        it("should be -2 if it isn't the last day yet",function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Project X',
                ObjectID: 1236
            });
            
            var iteration = {
                Name: 'Sprint 1',
                ObjectID: 8675309,
                StartDate: tuesday,
                EndDate: shiftDayBeginningToEnd(thursday)
            };
            project.addIteration(iteration);
            
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, TaskEstimateTotal: 0, CreationDate: tuesday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, TaskEstimateTotal: 4, CreationDate: tuesday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, TaskEstimateTotal: 4, CreationDate: tuesday });

            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, TaskEstimateTotal: 4, CreationDate: wednesday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, TaskEstimateTotal: 0, CreationDate: wednesday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, TaskEstimateTotal: 0, CreationDate: wednesday });
            
            
            project.setIterationCumulativeFlowData([
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2
            ]);
            
            expect(project.get('health_churn_task')).toEqual(-2);
        });
    });
});