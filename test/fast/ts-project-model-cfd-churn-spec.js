describe("Fast Project Model tests for ICFD health",function(){
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
  
    describe("When adding ICFD data to calculate churn", function(){
        it('should reset health measures',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Project X',
                ObjectID: 1236
            });
            
            var iteration = {
                Name: 'Sprint 1',
                ObjectID: 8675309,
                StartDate: friday,
                EndDate: shiftDayBeginningToEnd(thursday)
            };
            project.addIteration(iteration);
            
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: friday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: friday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: friday });
            
            project.setIterationCumulativeFlowData([ accepted_day_1,in_p_day_1,defined_day_1]);
            
            project.resetHealth();
            expect(project.get('health_churn')).toEqual(-2);
            expect(project.get('health_churn_direction')).toEqual(-2);
            expect(project.get('health_churn_task')).toEqual(-2);
        });
    });
    
    describe("When adding ICFD data to projects calculate churn",function(){
        it('should provide 0 when no changes in sizes',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Project X',
                ObjectID: 1236
            });
            
            var iteration = {
                Name: 'Sprint 1',
                ObjectID: 8675309,
                StartDate: monday,
                EndDate: shiftDayBeginningToEnd(tuesday)
            };
            project.addIteration(iteration);
            
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: monday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: monday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: monday });

            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 1, CreationDate: tuesday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 2, CreationDate: tuesday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 2, CreationDate: tuesday });

            project.setIterationCumulativeFlowData([ 
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2
            ]);
            
            expect(project.get('health_churn')).toEqual(0);
            expect(project.get('health_churn_direction')).toEqual(0);
            expect(project.get('health_churn_task')).toEqual(-2);
        });
        
        it('should provide standard deviation when value increased',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Project X',
                ObjectID: 1236
            });
            
            var iteration = {
                Name: 'Sprint 1',
                ObjectID: 8675309,
                StartDate: monday,
                EndDate: shiftDayBeginningToEnd(wednesday)
            };
            project.addIteration(iteration);
            
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: monday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: monday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 1, CreationDate: monday });

            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 3, CreationDate: tuesday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: tuesday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: tuesday });

            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 6, CreationDate: wednesday });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: wednesday });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 1, CreationDate: wednesday });

            project.setIterationCumulativeFlowData([ 
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,in_p_day_3,defined_day_3
            ]);
            
            expect(project.get('health_churn')).toEqual(0.47);
            expect(project.get('health_churn_direction')).toEqual(1);
            expect(project.get('health_churn_task')).toEqual(-2);
        });
        
        it('should provide standard deviation when value decreased',function() {            
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Project X',
                ObjectID: 1236
            });
            
            var iteration = {
                Name: 'Sprint 1',
                ObjectID: 8675309,
                StartDate: monday,
                EndDate: shiftDayBeginningToEnd(wednesday)
            };
            project.addIteration(iteration);
            
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 6, CreationDate: monday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: monday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 1, CreationDate: monday });

            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 3, CreationDate: tuesday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: tuesday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: tuesday });

            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: wednesday });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: wednesday });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 1, CreationDate: wednesday });

            project.setIterationCumulativeFlowData([ 
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,in_p_day_3,defined_day_3
            ]);
            
            expect(project.get('health_churn')).toEqual(0.47);
            expect(project.get('health_churn_direction')).toEqual(-1);
            expect(project.get('health_churn_task')).toEqual(-2);
        });
        
    });
});